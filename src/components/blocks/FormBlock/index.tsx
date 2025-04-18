import * as React from 'react';
import classNames from 'classnames';

import { getComponent } from '../../components-registry';
import { mapStylesToClassNames as mapStyles } from '../../../utils/map-styles-to-class-names';
import SubmitButtonFormControl from './SubmitButtonFormControl';

// Access key is now read from environment variables
// IMPORTANT: Ensure NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY is set in your .env file
const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

export default function FormBlock(props) {
    const formRef = React.createRef<HTMLFormElement>();
    const [result, setResult] = React.useState<string | null>(null);
    const { fields = [], elementId, submitButton, className, styles = {}, 'data-sb-field-path': fieldPath } = props;

    if (fields.length === 0) {
        return null;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setResult('Sending....');

        const formData = new FormData(formRef.current);
        if (!WEB3FORMS_ACCESS_KEY) {
            console.error("Web3Forms Access Key is not set in environment variables.");
            setResult("Configuration error: Access key missing.");
            return; // Stop submission if key is missing
        }
        formData.append('access_key', WEB3FORMS_ACCESS_KEY);

        // Add form name if elementId is present
        if (elementId) {
            formData.append('form-name', elementId);
        }

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setResult('Form Submitted Successfully');
                formRef.current?.reset(); // Reset form on success
                 // Optional: Clear result message after a few seconds
                setTimeout(() => setResult(null), 5000);
            } else {
                console.error('Error submitting form:', data);
                setResult(data.message || 'An error occurred.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setResult('An error occurred while submitting the form.');
        }
    }

    return (
        <form
            className={classNames(
                'sb-component',
                'sb-component-block',
                'sb-component-form-block',
                className,
                styles?.self?.margin ? mapStyles({ margin: styles?.self?.margin }) : undefined,
                styles?.self?.padding ? mapStyles({ padding: styles?.self?.padding }) : undefined,
                styles?.self?.borderWidth && styles?.self?.borderWidth !== 0 && styles?.self?.borderStyle !== 'none'
                    ? mapStyles({
                          borderWidth: styles?.self?.borderWidth,
                          borderStyle: styles?.self?.borderStyle,
                          borderColor: styles?.self?.borderColor ?? 'border-primary'
                      })
                    : undefined,
                styles?.self?.borderRadius ? mapStyles({ borderRadius: styles?.self?.borderRadius }) : undefined
            )}
            name={elementId}
            id={elementId}
            onSubmit={handleSubmit}
            ref={formRef}
            data-sb-field-path={fieldPath}
            noValidate // Disable browser validation if using custom handling
        >
            <div
                className={classNames('w-full', 'flex', 'flex-wrap', 'gap-8', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}
                {...(fieldPath && { 'data-sb-field-path': '.fields' })}
            >
                {/* Hidden input for Web3Forms access key */}
                {/* It's also added via JS, but this can be a fallback or alternative */}
                {/* <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} /> */}

                {/* Honeypot Spam Protection (optional but recommended) */}
                 <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />


                {/* Render all form fields */}
                {fields.map((field, index) => {
                    const modelName = field.__metadata.modelName;
                    if (!modelName) {
                        console.error('Form field is missing __metadata.modelName', field);
                        return <div key={index} className="text-red-500">Error: Field model name missing.</div>;
                        // throw new Error(`form field does not have the 'modelName' property`);
                    }
                    const FormControl = getComponent(modelName);
                    if (!FormControl) {
                         console.error(`No component registered for model name: ${modelName}`);
                         return <div key={index} className="text-red-500">Error: No component for {modelName}.</div>;
                        // throw new Error(`no component matching the form field model name: ${modelName}`);
                    }
                    // Ensure required attribute is passed if field.isRequired is true
                    const fieldProps = { ...field, isRequired: field.isRequired };
                    return <FormControl key={index} {...fieldProps} {...(fieldPath && { 'data-sb-field-path': `.${index}` })} />;
                })}
            </div>

             {/* Submission status message */}
            {result && (
                <div className={classNames('mt-4', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}>
                    <span>{result}</span>
                </div>
            )}


            {/* Submit Button */}
            {submitButton && (
                <div className={classNames('mt-8', 'flex', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}>
                    {/* Pass the result state or other indicators if needed */}
                    <SubmitButtonFormControl {...submitButton} {...(fieldPath && { 'data-sb-field-path': '.submitButton' })} />
                </div>
            )}
        </form>
    );
}

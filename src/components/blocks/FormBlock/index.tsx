import * as React from 'react';
import classNames from 'classnames';

import { getComponent } from '../../components-registry';
import { mapStylesToClassNames as mapStyles } from '../../../utils/map-styles-to-class-names';
import SubmitButtonFormControl from './SubmitButtonFormControl';

export default function FormBlock(props) {
    const formRef = React.createRef<HTMLFormElement>();
    const { fields = [], elementId, submitButton, className, styles = {}, 'data-sb-field-path': fieldPath } = props;
    const [submitted, setSubmitted] = React.useState(false);
    const [error, setError] = React.useState(false);

    if (fields.length === 0) {
        return null;
    }

    function handleSubmit(event) {
        event.preventDefault();
        setError(false);

        const formData = new FormData(formRef.current);
        const data = Object.fromEntries(formData);

        // Encode the form data for Netlify
        const encodedData = Object.keys(data)
            .map(key => {
                const value = data[key];
                // Handle different types of form values
                const stringValue = typeof value === 'string' ? value :
                    (value instanceof File ? value.name : String(value));
                return encodeURIComponent(key) + "=" + encodeURIComponent(stringValue);
            })
            .join("&");

        // Submit to Netlify
        fetch("/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: encodedData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Form submission failed with status ${response.status}`);
                }
                console.log("Form successfully submitted to Netlify!");
                setSubmitted(true);
                if (formRef.current) {
                    formRef.current.reset();
                }
                return response;
            })
            .catch(error => {
                console.error("Error submitting form:", error);
                setError(true);
            });
    }

    // Display success message if form submitted
    if (submitted) {
        return (
            <div
                className={classNames(
                    'sb-component',
                    'sb-component-block',
                    'sb-component-form-block',
                    'p-4',
                    'text-center',
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
                data-sb-field-path={fieldPath}
            >
                <p>Thank you for your submission!</p>
            </div>
        );
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
            name="contact"
            id="contact"
            method="POST"
            onSubmit={handleSubmit}
            ref={formRef}
            data-sb-field-path={fieldPath}
            data-netlify="true"
            netlify-honeypot="bot-field"
        >
            {error && (
                <div className="text-red-500 mb-4">
                    There was an error submitting the form. Please try again.
                </div>
            )}
            <input type="hidden" name="form-name" value="contact" />
            <input type="hidden" name="bot-field" />
            <div
                className={classNames('w-full', 'flex', 'flex-wrap', 'gap-8', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}
                {...(fieldPath && { 'data-sb-field-path': '.fields' })}
            >
                {fields.map((field, index) => {
                    const modelName = field.__metadata.modelName;
                    if (!modelName) {
                        throw new Error(`form field does not have the 'modelName' property`);
                    }
                    const FormControl = getComponent(modelName);
                    if (!FormControl) {
                        throw new Error(`no component matching the form field model name: ${modelName}`);
                    }
                    return <FormControl key={index} {...field} {...(fieldPath && { 'data-sb-field-path': `.${index}` })} />;
                })}
            </div>
            {submitButton && (
                <div className={classNames('mt-8', 'flex', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}>
                    <SubmitButtonFormControl {...submitButton} {...(fieldPath && { 'data-sb-field-path': '.submitButton' })} />
                </div>
            )}
        </form>
    );
}

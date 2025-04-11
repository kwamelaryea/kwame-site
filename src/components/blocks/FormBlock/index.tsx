import * as React from 'react';
import classNames from 'classnames';

import { getComponent } from '../../components-registry';
import { mapStylesToClassNames as mapStyles } from '../../../utils/map-styles-to-class-names';
import SubmitButtonFormControl from './SubmitButtonFormControl';

// Helper function to encode form data for fetch
const encode = (data) => {
    return Object.keys(data)
        .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
        .join("&");
}

export default function FormBlock(props) {
    const formRef = React.createRef<HTMLFormElement>();
    const { fields = [], elementId, submitButton, className, styles = {}, 'data-sb-field-path': fieldPath } = props;
    const [submitted, setSubmitted] = React.useState(false); // Add state for submission status

    if (fields.length === 0) {
        return null;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const data = new FormData(formRef.current);
        const value = Object.fromEntries(data.entries());

        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({ "form-name": "contact", ...value }) // Use "contact" as the form name for Netlify
        })
            .then(() => {
                setSubmitted(true); // Set submission status to true on success
                console.log('Form successfully submitted');
                // Optionally clear the form or show a success message
                // formRef.current.reset(); // Uncomment to clear form
            })
            .catch(error => alert(error));
    }

    // Display success message if form submitted
    if (submitted) {
        return (
            <div
                className={classNames(
                    'sb-component',
                    'sb-component-block',
                    'sb-component-form-block',
                    'p-4', // Add some padding
                    'text-center', // Center text
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
            name={elementId}
            id={elementId}
            onSubmit={handleSubmit}
            ref={formRef}
            data-sb-field-path={fieldPath}
            data-netlify="true" // Add Netlify attribute
            data-netlify-honeypot="bot-field" // Add Netlify honeypot attribute
        >
            {/* Netlify honeypot field */}
            <input name="bot-field" style={{ display: 'none' }} />
            <div
                className={classNames('w-full', 'flex', 'flex-wrap', 'gap-8', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}
                {...(fieldPath && { 'data-sb-field-path': '.fields' })}
            >
                <input type="hidden" name="form-name" value="contact" />
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

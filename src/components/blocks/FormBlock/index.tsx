import * as React from 'react';
import classNames from 'classnames';
import ReCAPTCHA from 'react-google-recaptcha';

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
    const recaptchaRef = React.createRef<ReCAPTCHA>();
    const { fields = [], elementId, submitButton, className, styles = {}, 'data-sb-field-path': fieldPath } = props;
    const [submitted, setSubmitted] = React.useState(false); // Add state for submission status
    const [recaptchaValue, setRecaptchaValue] = React.useState<string | null>(null);

    if (fields.length === 0) {
        return null;
    }

    function handleSubmit(event) {
        event.preventDefault(); // We need to prevent default to handle reCAPTCHA

        // Verify reCAPTCHA first
        if (!recaptchaValue) {
            alert("Please complete the reCAPTCHA verification");
            return false;
        }

        // Get form data and add the reCAPTCHA token
        const formData = new FormData(formRef.current);
        formData.append('g-recaptcha-response', recaptchaValue);

        // Submit the form programmatically to Netlify
        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encode({
                "form-name": "contact",
                "g-recaptcha-response": recaptchaValue,
                ...Object.fromEntries(formData)
            })
        })
            .then(response => {
                console.log("Form successfully submitted to Netlify!");
                setSubmitted(true);
                // Reset reCAPTCHA
                recaptchaRef.current?.reset();
            })
            .catch(error => {
                console.error("Form submission error:", error);
                alert("There was an error submitting the form. Please try again.");
            });

        return false;
    }

    // Handle reCAPTCHA change
    const handleRecaptchaChange = (value: string | null) => {
        setRecaptchaValue(value);
    };

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
            name="contact"
            id="contact"
            method="POST"
            onSubmit={handleSubmit}
            ref={formRef}
            data-sb-field-path={fieldPath}
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            data-netlify-recaptcha="true"
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

                {/* reCAPTCHA component */}
                <div className="w-full mt-4">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'} // Using environment variable with fallback
                        onChange={handleRecaptchaChange}
                    />
                    <small className="text-gray-500 mt-2 block">
                        This site is protected by reCAPTCHA.
                    </small>
                </div>
            </div>
            {submitButton && (
                <div className={classNames('mt-8', 'flex', mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' }))}>
                    <SubmitButtonFormControl {...submitButton} {...(fieldPath && { 'data-sb-field-path': '.submitButton' })} />
                </div>
            )}
        </form>
    );
}

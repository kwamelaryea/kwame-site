import * as React from 'react';
import classNames from 'classnames';
import ReCAPTCHA from 'react-google-recaptcha';

import { getComponent } from '../../components-registry';
import { mapStylesToClassNames as mapStyles } from '../../../utils/map-styles-to-class-names';
import SubmitButtonFormControl from './SubmitButtonFormControl';

export default function FormBlock(props) {
    const formRef = React.createRef<HTMLFormElement>();
    const recaptchaRef = React.createRef<ReCAPTCHA>();
    const { fields = [], elementId = 'contact', submitButton, className, styles = {}, 'data-sb-field-path': fieldPath } = props; // Default elementId to 'contact'
    const [submitted, setSubmitted] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [recaptchaValue, setRecaptchaValue] = React.useState<string | null>(null);

    if (fields.length === 0) {
        return null;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null); // Clear previous errors

        if (!recaptchaValue) {
            setError("Please complete the reCAPTCHA verification.");
            return;
        }

        const formData = new FormData(formRef.current!);
        const data: { [key: string]: any } = Object.fromEntries(formData);
        data['g-recaptcha-response'] = recaptchaValue; // Add reCAPTCHA token

        console.log("Submitting form data to /api/contact:", data);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("API Error Response:", result);
                throw new Error(result.message || `Form submission failed with status ${response.status}`);
            }

            // Successful submission
            console.log("API Success Response:", result);
            setSubmitted(true);
            formRef.current?.reset(); // Clear the form
            recaptchaRef.current?.reset(); // Reset reCAPTCHA
            setRecaptchaValue(null); // Reset reCAPTCHA state

        } catch (error: any) {
            console.error("Form submission fetch error:", error);
            setError(error.message || "An unexpected error occurred. Please try again.");
            // Optionally reset reCAPTCHA on error too, depending on desired UX
            // recaptchaRef.current?.reset();
            // setRecaptchaValue(null);
        }
    }

    // Handle reCAPTCHA change
    const handleRecaptchaChange = (value: string | null) => {
        setRecaptchaValue(value);
        if (value) {
            setError(null); // Clear error when reCAPTCHA is completed
        }
    };

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
                {/* Optional: Add a button to submit another message */}
                {/* <button onClick={() => setSubmitted(false)} className="mt-4 text-blue-500 underline">Submit another message</button> */}
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
            name={elementId} // Keep name for potential non-JS fallback or styling
            id={elementId}   // Keep id for potential labels
            onSubmit={handleSubmit}
            ref={formRef}
            data-sb-field-path={fieldPath}
            // Removed Netlify attributes: data-netlify, data-netlify-honeypot, data-netlify-recaptcha
            // Removed method="POST" as it's handled by fetch
        >
            {/* Display Submission Error Message */}
            {error && (
                <div className="w-full p-3 mb-4 text-center text-red-700 bg-red-100 border border-red-400 rounded">
                    {error}
                </div>
            )}

            {/* Removed hidden Netlify inputs: form-name, bot-field */}
            
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

                {/* reCAPTCHA component */}
                <div className="w-full mt-4">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LdEFxUrAAAAAKAfXirVjGLOiILHFOFDA1hzb9E7'} // Using ENV Var with fallback to your key
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

const decoratorValidator = (fn, validate, argsType ) => {
    return async function (event) {
        const data = JSON.parse(event[argsType]);
        const { error, value } = validate(data, { abortEarly: true });
        event[argsType] = value;
        if (!error) {
            return fn.apply(this, arguments)
        }

        return {
            statusCode: 422, // Unprocessable Entity
            body: JSON.stringify(error.message)
        }
    }
}

module.exports = decoratorValidator;
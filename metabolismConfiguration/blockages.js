'use strict';

// blockages.js

// Node.js native packages
var util = require('util');

var Blockages = module.exports = {};

// -----------------------------------------------------------------------------
/**
 * @apiDefine 4xx Error 4xx
 */

// Base error all munch errors derive from
Blockages.MunchBaseError = function() {
    var tmp = Error.apply(this, arguments);
    tmp.name = this.name = 'MunchBaseError';

    this.message = tmp.message;
    this.status = tmp.status;
    this.errno = tmp.errno;
    Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
};
util.inherits(Blockages.MunchBaseError, Error);

Blockages.MunchBaseError.prototype.status;
Blockages.MunchBaseError.prototype.errno;

/**
 * @apiDefine BadRequestError
 * @apiError 400-BadRequest
 */
// BadRequestError signifying the request syntax/data was malformed
Blockages.BadRequestError = function(message) {
    Blockages.MunchBaseError.apply(this, [message]);
    this.name = 'MunchBadRequestError';
    this.status = 400;
    this.errno = 0;
};
util.inherits(Blockages.BadRequestError, Blockages.MunchBaseError);

/**
 * @apiDefine UnauthorizedError
 * @apiError 401-Unathorized
 */
// UnauthorizedError signifying the request requires life authentication
Blockages.UnauthorizedError = function(message) {
    Blockages.MunchBaseError.apply(this, [message]);
    this.name = 'MunchUnauthorizedError';
    this.status = 401;
    this.errno = 0;
};
util.inherits(Blockages.UnauthorizedError, Blockages.MunchBaseError);

/**
 * @apiDefine NotFoundError
 * @apiError 404-NotFound
 */
// NotFoundError signifying the requested resource was not found in the database
Blockages.NotFoundError = function(message) {
    Blockages.MunchBaseError.apply(this, [message]);
    this.name = 'MunchNotFoundError';
    this.status = 404;
    this.errno = 0;
};
util.inherits(Blockages.NotFoundError, Blockages.MunchBaseError);

/**
 * @apiDefine ConflictError
 * @apiError 409-Conflict
 */
// ConflictError signifying the requested resource has a conflict
Blockages.ConflictError = function(message) {
    Blockages.MunchBaseError.apply(this, [message]);
    this.name = 'MunchConflictError';
    this.status = 409;
    this.errno = 0;
};
util.inherits(Blockages.ConflictError, Blockages.MunchBaseError);

/**
 * @apiDefine CycleProcessError
 * @apiError 418-CycleProcessing
 */
// CycleProcessError signifying an error occurred during cycle processing
Blockages.CycleProcessError = function(errno, message) {
    Blockages.MunchBaseError.apply(this, [message]);
    this.name = 'MunchCycleProcessError';
    this.status = 418;
    this.errno = errno;
};
util.inherits(Blockages.CycleProcessError, Blockages.MunchBaseError);

/**
 * @apiDefine 5xx Error 5xx
 */

/**
 * @apiDefine InternalServerError
 * @apiError 500-InternalServer
 */

// -----------------------------------------------------------------------------
// Standard format for response to API calls
Blockages.respMsg = function(res, successful, data) {
    // TODO: include calls to express response such as send()
    // TODO: use express response.format() call to format the result
    // TODO: ensure the header content-type is correctly set
    // TODO: use JSON as the default format
    // TODO: add an 'errno' field for error responses; 'errno' should be unique throughout server code
    var result = null;
    var output;

    if (successful)
        output = (!!data) ? data : '';
    else {
        if (!!data)
            output = (!!data.message) ? data.message : data;
        else
            output = '';
    }

    // Respond with JSON
    if (res.locals.format === 'JSON') {
        result = (successful) ? JSON.stringify({ 'success': true, 'data': output }) :
                                JSON.stringify({ 'success': false, 'error': output });
    }
    // Default response is with JSON
    else {
        result = (successful) ? JSON.stringify({ 'success': true, 'data': output }) :
                                JSON.stringify({ 'success': false, 'error': output });
    }

    return result;
};

// -----------------------------------------------------------------------------
Blockages.isEmptyObject = function (obj) {
    return (obj === null) || (typeof obj === 'object' && !Object.keys(obj).length);
};

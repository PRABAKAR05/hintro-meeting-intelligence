const { successResponse, errorResponse } = require('../../src/utils/apiResponse');
const ApiError = require('../../src/utils/apiError');

describe('API Response Helpers', () => {
  let mockRes;
  let mockReq;

  beforeEach(() => {
    mockReq = { traceId: 'test-trace-123' };
    mockRes = {
      req: mockReq,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('successResponse', () => {
    it('should return 200 with correct format', () => {
      successResponse(mockRes, { message: 'ok' });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        traceId: 'test-trace-123',
        success: true,
        data: { message: 'ok' },
      });
    });

    it('should support custom status code', () => {
      successResponse(mockRes, { id: '123' }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        traceId: 'test-trace-123',
        success: true,
        data: { id: '123' },
      });
    });

    it('should return empty data by default', () => {
      successResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        traceId: 'test-trace-123',
        success: true,
        data: {},
      });
    });
  });

  describe('errorResponse', () => {
    it('should return error with correct format', () => {
      errorResponse(mockRes, 'VALIDATION_ERROR', 'Title is required', 422);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        traceId: 'test-trace-123',
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required',
        },
      });
    });

    it('should default to 500 status', () => {
      errorResponse(mockRes, 'INTERNAL_ERROR', 'Something broke');

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

describe('ApiError', () => {
  it('should create a bad request error', () => {
    const err = ApiError.badRequest('Missing field');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Missing field');
    expect(err.isOperational).toBe(true);
  });

  it('should create an unauthorized error', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should create a not found error', () => {
    const err = ApiError.notFound('Meeting not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Meeting not found');
  });

  it('should create a validation error', () => {
    const err = ApiError.validation('Invalid email');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should create a conflict error', () => {
    const err = ApiError.conflict();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('should create an internal error', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });
});

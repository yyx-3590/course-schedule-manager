process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
delete process.env.SMTP_HOST;

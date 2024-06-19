import * as jwt from 'jsonwebtoken';

type MockJwk = {
  kty: string;
  x: string;
  y: string;
  crv: string;
  d: string;
};

/**
 * Get the mock server's keypair as a JWK.
 * @returns {MockJwk} The JWK version of the mock keypair.
 */
export function getMockPrivateJwk(): MockJwk {
  return {
    kty: 'EC',
    /* Disable spell checking on encoded binary data. spell-checker:disable */
    x: 'fiHkGj7Ev-ogxzOXo-VRuE1WOz-bQKMvI8pCLkS3HrM',
    y: 'Xyu6BlSX6DtT-H0oDoxmwkrJyVCWx9XDic1crTCw3Bg',
    crv: 'P-256',
    d: 'EtNGzzl0OTELWM1Y4k_M7mPK9m5ZYZYKBg6V8u9DxOQ',
    /* Turn spell checking back on now. spell-checker:enable */
  };
}

/**
 * Get the mock server's keypair as a PEM.
 * @returns {string} The PEM version of the mock keypair.
 */
export function getMockPrivateKey() {
  return `
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgEtNGzzl0OTELWM1Y
4k/M7mPK9m5ZYZYKBg6V8u9DxOShRANCAAR+IeQaPsS/6iDHM5ej5VG4TVY7P5tA
oy8jykIuRLces18rugZUl+g7U/h9KA6MZsJKyclQlsfVw4nNXK0wsNwY
-----END PRIVATE KEY-----
`;
}

/**
 * Get a signed token that lets a visitor log in to only the mock server
 * for the next 8 hours.
 * @returns {string} A signed token for application 123456.
 */
export function signMockToken() {
  return jwt.sign({}, getMockPrivateKey(), {
    algorithm: 'ES256',
    noTimestamp: true,
    subject: `123456`,
  });
}

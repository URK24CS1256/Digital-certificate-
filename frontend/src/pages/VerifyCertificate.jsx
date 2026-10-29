import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import Brand from '../components/Brand';

function VerifyCertificate() {
  const [searchParams] = useSearchParams();

  const [certificateId, setCertificateId] = useState(
    searchParams.get('id') || ''
  );
  const [certificate, setCertificate] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const verifyCertificate = async (id) => {
    const cleanId = id.trim();

    if (!cleanId) return;

    setLoading(true);
    setCertificate(null);
    setMessage('');
    setSearched(false);

    try {
      const response = await api.get(
        `/certificates/verify/${encodeURIComponent(cleanId)}`
      );

      setCertificate(response.data.certificate || null);
      setMessage(
        response.data.message ||
          (response.data.valid
            ? 'This certificate is valid.'
            : 'This certificate is revoked.')
      );
    } catch (err) {
      setMessage(
        err.response?.status === 404
          ? err.response?.data?.message ||
              'Certificate not found. Please check the certificate ID.'
          : err.response?.data?.message ||
              'Unable to verify the certificate. Please try again.'
      );
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    const idFromUrl = searchParams.get('id');

    if (idFromUrl) {
      setCertificateId(idFromUrl);
      verifyCertificate(idFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await verifyCertificate(certificateId);
  };

  const resultType =
    certificate?.status === 'Valid'
      ? 'valid'
      : certificate?.status === 'Revoked'
      ? 'revoked'
      : 'not-found';

  // The QR code uses the current app origin and the public verification route.
  const verificationUrl = certificate
    ? `${window.location.origin}/verify?id=${encodeURIComponent(
        certificate.certificateId
      )}`
    : '';

  return (
    <div className="verify-page min-vh-100">
      <nav className="verify-navbar">
        <Brand />
        <a href="/login" className="verify-login-btn">
          Admin Login
        </a>
      </nav>

      <main className="container verify-main py-5">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-7">
            <div className="verify-heading text-center mb-4">
              <div className="verify-heading-icon">✓</div>
              <h1>Certificate Verification</h1>
              <p>
                Verify the authenticity and current status of a
                digital certificate.
              </p>
            </div>

            <section className="verify-glass-card">
              <div className="verify-card-body">
                <form onSubmit={handleSubmit}>
                  <label
                    htmlFor="certificateId"
                    className="verify-label"
                  >
                    Certificate ID
                  </label>

                  <input
                    id="certificateId"
                    type="text"
                    className="verify-input"
                    placeholder="e.g. DCV01"
                    value={certificateId}
                    onChange={(event) =>
                      setCertificateId(event.target.value)
                    }
                    required
                  />

                  <button
                    type="submit"
                    className="verify-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Certificate →'}
                  </button>
                </form>

                {searched && (
                  <div
                    className={`verification-result verification-result--${resultType}`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="verification-result-icon">
                      {resultType === 'valid'
                        ? '✓'
                        : resultType === 'revoked'
                        ? '!'
                        : '×'}
                    </div>

                    <div className="verification-result-content">
                      <h4>
                        {resultType === 'valid'
                          ? 'Certificate Verified'
                          : resultType === 'revoked'
                          ? 'Certificate Revoked'
                          : 'Verification Result'}
                      </h4>
                      <p>{message}</p>
                    </div>
                  </div>
                )}

                {certificate && (
                  <>
                    <div className="verify-details-card">
                      <div className="verify-details-heading">
                        <span>Certificate Details</span>
                        <span
                          className={`verify-status-pill ${
                            certificate.status === 'Valid'
                              ? 'verify-status-pill--valid'
                              : 'verify-status-pill--revoked'
                          }`}
                        >
                          {certificate.status}
                        </span>
                      </div>

                      <div className="verify-detail-row">
                        <span>Certificate ID</span>
                        <strong>{certificate.certificateId}</strong>
                      </div>
                      <div className="verify-detail-row">
                        <span>Recipient</span>
                        <strong>{certificate.recipientName}</strong>
                      </div>
                      <div className="verify-detail-row">
                        <span>Course</span>
                        <strong>{certificate.course}</strong>
                      </div>
                      <div className="verify-detail-row">
                        <span>Issuer</span>
                        <strong>{certificate.issuer}</strong>
                      </div>
                      <div className="verify-detail-row">
                        <span>Issue Date</span>
                        <strong>
                          {certificate.issueDate
                            ? String(certificate.issueDate).slice(0, 10)
                            : '—'}
                        </strong>
                      </div>
                    </div>

                    <div className="verify-qr-card">
                      <div className="verify-qr-copy">
                        <h4>Scan to Verify</h4>
                        <p>
                          Scan this QR code to check the certificate's
                          current status on Cerver.
                        </p>
                      </div>

                      <div className="verify-qr-code">
                        <QRCodeSVG
                          value={verificationUrl}
                          size={180}
                          level="H"
                          marginSize={2}
                          title={`Verify certificate ${certificate.certificateId}`}
                        />
                      </div>

                      <p className="verify-qr-id">
                        Certificate ID: {certificate.certificateId}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>

            <p className="verify-footer-note text-center">
              Only certificates registered in the Cerver system
              can be verified.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VerifyCertificate;

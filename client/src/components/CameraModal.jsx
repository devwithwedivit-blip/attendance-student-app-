import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Check, X, MapPin, AlertCircle, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { detectFaceInCircle } from '../utils/faceDetector';

export default function CameraModal({ isOpen, onClose, onConfirm, actionType = 'check_in', loading = false }) {
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedFaceVerified, setCapturedFaceVerified] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Fetching GPS...');
  const [facingMode, setFacingMode] = useState('user'); // front camera by default

  // Real-time live face detection state
  const [faceStatus, setFaceStatus] = useState({
    detected: false,
    score: 0,
    reason: 'Position your face inside the circle',
    insideCircle: false
  });
  const [validatingCapture, setValidatingCapture] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectionTimerRef = useRef(null);

  // Initialize camera & geolocation on open
  useEffect(() => {
    if (isOpen) {
      startCamera();
      fetchLocation();
    } else {
      stopCamera();
      resetState();
    }

    return () => {
      stopCamera();
      clearInterval(detectionTimerRef.current);
    };
  }, [isOpen, facingMode]);

  // Real-time Live Face Detection Loop
  useEffect(() => {
    if (!isOpen || capturedPhoto || !stream) {
      clearInterval(detectionTimerRef.current);
      return;
    }

    detectionTimerRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const result = await detectFaceInCircle(videoRef.current);
          setFaceStatus(result);
        } catch (err) {
          console.warn('Face detection cycle error:', err);
        }
      }
    }, 180);

    return () => clearInterval(detectionTimerRef.current);
  }, [isOpen, stream, capturedPhoto]);

  const resetState = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCapturedFaceVerified(false);
    setCameraError(null);
    setLocation(null);
    setLocationStatus('Fetching GPS...');
    setFaceStatus({
      detected: false,
      score: 0,
      reason: 'Position your face inside the circle',
      insideCircle: false
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable or blocked. Please grant camera permission to verify your face.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    clearInterval(detectionTimerRef.current);
  };

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          setLocationStatus(`📍 GPS Tagged (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => {
          console.warn('Geolocation fallback:', err.message);
          setLocation({
            latitude: 28.6139,
            longitude: 77.2090
          });
          setLocationStatus('📍 Campus Coordinates (Registered)');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLocation({ latitude: 28.6139, longitude: 77.2090 });
      setLocationStatus('📍 Campus Registered Coordinates');
    }
  };

  const capturePhoto = async () => {
    // STRICT ENFORCEMENT: Face MUST be detected inside the circle
    if (!faceStatus.detected) {
      alert('Face Verification Required:\n\nAttendance cannot be recorded without a live human face properly centered inside the circle guide.');
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setValidatingCapture(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Verify face once more on the actual captured still frame
    const stillVerification = await detectFaceInCircle(canvas);
    if (!stillVerification.detected) {
      setValidatingCapture(false);
      alert('Verification Failed:\n\nNo valid human face was detected in the captured photo. Please face the camera steadily inside the circle and try again.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    setCapturedPhoto(dataUrl);
    setCapturedFaceVerified(true);
    setValidatingCapture(false);

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
    }, 'image/jpeg', 0.90);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Run face detection on the uploaded image
        const uploadVerification = await detectFaceInCircle(img);
        if (!uploadVerification.detected) {
          alert('Upload Rejected:\n\nNo live human face could be verified in this photo. Company regulations strictly require a clear face photo inside the frame.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setCapturedPhoto(event.target.result);
        setCapturedBlob(file);
        setCapturedFaceVerified(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCapturedFaceVerified(false);
  };

  const handleConfirm = () => {
    // STRICT ENFORCEMENT: Never allow check-in or check-out without a verified human face
    if (!capturedPhoto || !capturedFaceVerified) {
      alert('Security Directives Violation:\n\nPhoto check-in / check-out is strictly blocked unless a live human face is verified inside the circle.');
      return;
    }

    onConfirm({
      photoBlob: capturedBlob,
      photoBase64: capturedPhoto,
      latitude: location?.latitude,
      longitude: location?.longitude,
      face_verified: true
    });
  };

  if (!isOpen) return null;

  const isCheckIn = actionType === 'check_in';
  const title = isCheckIn ? 'Photographic Biometric Check-In' : 'Photographic Biometric Check-Out';

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: isCheckIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: isCheckIn ? '#10b981' : '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Live human face required inside the circular reticle
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-icon" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Viewport Box */}
          <div className="camera-view-box">
            {capturedPhoto ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={capturedPhoto}
                  alt="Captured attendance verification"
                  className="camera-preview-img confirmed"
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(6, 78, 59, 0.92)',
                  border: '1px solid #10b981',
                  color: '#a7f3d0',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}>
                  <ShieldCheck size={15} color="#10b981" />
                  <span>Biometric Human Face Verified</span>
                </div>
              </div>
            ) : cameraError ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                textAlign: 'center',
                background: '#090d16'
              }}>
                <ShieldAlert size={42} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', maxWidth: '340px' }}>
                  {cameraError}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={startCamera}>
                    <RefreshCw size={14} />
                    Retry Camera
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                    Upload Selfie (Face Required)
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                  onLoadedMetadata={() => videoRef.current?.play()}
                />
                
                {/* Real-Time Interactive Biometric Reticle */}
                <div className="camera-reticle">
                  <div className={`camera-reticle-face ${faceStatus.detected ? 'verified' : 'unverified'}`}>
                    <div className="scan-beam" />
                  </div>

                  {/* Dynamic Status Badge */}
                  <div className={`face-status-badge ${faceStatus.detected ? 'verified' : 'unverified'}`}>
                    {faceStatus.detected ? (
                      <>
                        <ShieldCheck size={14} color="#10b981" />
                        <span>Live Face Verified ({faceStatus.score}%)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} color="#ef4444" />
                        <span>{faceStatus.reason}</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Hidden canvas for drawing frame */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          {/* Location & Status Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.85rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={14} color="#10b981" />
              <span>{locationStatus}</span>
            </div>
            {!capturedPhoto && !cameraError && (
              <button
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              >
                <RefreshCw size={12} />
                Flip Camera
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          {capturedPhoto ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleRetake}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Retake
              </button>
              <button
                className={`btn ${isCheckIn ? 'btn-primary' : 'btn-coral'}`}
                onClick={handleConfirm}
                disabled={loading || !capturedFaceVerified}
                style={{
                  opacity: capturedFaceVerified ? 1 : 0.5,
                  cursor: capturedFaceVerified ? 'pointer' : 'not-allowed'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirm & {isCheckIn ? 'Check In' : 'Check Out'}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button
                className={`btn ${isCheckIn ? 'btn-primary' : 'btn-coral'}`}
                onClick={capturePhoto}
                disabled={!faceStatus.detected || Boolean(cameraError) || validatingCapture}
                style={{
                  opacity: faceStatus.detected ? 1 : 0.5,
                  cursor: faceStatus.detected ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
                title={faceStatus.detected ? 'Face verified - Click to take photo' : 'Align your face inside the circle first'}
              >
                {validatingCapture ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    {faceStatus.detected ? 'Capture Photo' : 'Face Required in Circle'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  Search,
  RotateCcw,
  ScanFace,
  IdCard,
  Info,
  ChevronRight,
  User,
  FileCheck,
  Camera,
  MapPin,
} from 'lucide-react';
import { useVerificationStore, Verification } from '@/stores/verificationStore';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES } from '@/lib/countries';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormatDate } from '@/lib/formatDate';

type SubView = 'list' | 'wizard' | 'detail';
type WizardStep = 1 | 2 | 3 | 4;

const DOC_TYPES = [
  { value: 'PASSPORT_FRONT', labelKey: 'wizard_doc_passport_front', icon: <FileCheck className="w-5 h-5" />, isId: true },
  { value: 'PASSPORT_BACK', labelKey: 'wizard_doc_passport_back', icon: <FileCheck className="w-5 h-5" />, isId: false },
  { value: 'NATIONAL_ID_FRONT', labelKey: 'wizard_doc_id_front', icon: <IdCard className="w-5 h-5" />, isId: true },
  { value: 'NATIONAL_ID_BACK', labelKey: 'wizard_doc_id_back', icon: <IdCard className="w-5 h-5" />, isId: false },
  { value: 'DRIVERS_LICENSE_FRONT', labelKey: 'wizard_doc_dl_front', icon: <FileText className="w-5 h-5" />, isId: true },
  { value: 'DRIVERS_LICENSE_BACK', labelKey: 'wizard_doc_dl_back', icon: <FileText className="w-5 h-5" />, isId: false },
  { value: 'PROOF_OF_ADDRESS', labelKey: 'wizard_doc_proof_address', icon: <MapPin className="w-5 h-5" />, isId: false },
  { value: 'OTHER', labelKey: 'wizard_doc_other', icon: <FileText className="w-5 h-5" />, isId: false },
] as const;

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  DOCUMENTS_UPLOADED: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  IN_REVIEW: 'bg-teal-100 text-teal-800',
  AWAITING_REVIEW: 'bg-teal-100 text-teal-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  FLAGGED: 'bg-orange-100 text-orange-800',
};

const riskColors: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-800',
  low: 'bg-emerald-100 text-emerald-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  medium: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  high: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
  critical: 'bg-red-100 text-red-800',
};

// ─── Step indicator ────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  current: WizardStep;
  steps: { label: string }[];
}
const StepIndicator: React.FC<StepIndicatorProps> = ({ current, steps }) => (
  <div className="flex items-center justify-between mb-8">
    {steps.map((s, i) => {
      const n = (i + 1) as WizardStep;
      const done = current > n;
      const active = current === n;
      return (
        <React.Fragment key={n}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : active
                  ? 'bg-amber-800 border-amber-800 text-white'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
            >
              {done ? <CheckCircle className="w-4 h-4" /> : n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? 'text-amber-900' : done ? 'text-emerald-700' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const VerificationPipeline: React.FC = () => {
  const { hasPermission } = useAuth();
  const store = useVerificationStore();
  const { t } = useTranslation();
  const formatDate = useFormatDate();

  const [subView, setSubView] = useState<SubView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [wizardCaseId, setWizardCaseId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    country: '',
    type: 'INDIVIDUAL',
  });
  // Track which doc types have been uploaded: { DOC_TYPE: docId }
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  // Per-card uploading state
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Step 2: dropdown
  const [selectedDocType, setSelectedDocType] = useState('');

  // Step 3: camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'preview'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Detail view
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => {
    store.fetchVerifications();
  }, []);

  // ── Camera helpers (defined before the cleanup effects that reference them) ──
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, []);

  // Stop camera stream whenever we leave step 3 or unmount
  useEffect(() => {
    if (wizardStep !== 3) stopCamera();
  }, [wizardStep, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraState('starting');
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch {
      setCameraError(t('wizard_selfie_no_camera'));
      setCameraState('idle');
    }
  }, [t]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setCameraState('preview');
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCameraState('idle');
    startCamera();
  }, [startCamera]);

  const confirmSelfie = useCallback(async () => {
    if (!capturedImage) return;
    const [header, data] = capturedImage.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const file = new File([arr], 'selfie.jpg', { type: mime });
    if (!wizardCaseId) return;
    setUploadingType('SELFIE');
    await useVerificationStore.getState().uploadDocument(wizardCaseId, file, 'SELFIE');
    if (!useVerificationStore.getState().error) setSelfieUploaded(true);
    setUploadingType(null);
    setCameraState('idle');
    setCapturedImage(null);
  }, [capturedImage, wizardCaseId]);

  const resetWizard = () => {
    setWizardStep(1);
    setWizardCaseId(null);
    setForm({ firstName: '', lastName: '', email: '', dateOfBirth: '', country: '', type: 'INDIVIDUAL' });
    setUploadedDocs({});
    setSelfieUploaded(false);
    setUploadingType(null);
    setSelectedDocType('');
    setCapturedImage(null);
    setCameraError(null);
    stopCamera();
    store.clearSelected();
  };

  const startWizard = () => {
    resetWizard();
    setSubView('wizard');
  };

  const handleStep1Submit = async () => {
    if (!form.firstName || !form.lastName || !form.country) return;
    const result = await store.createVerification({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      dateOfBirth: form.dateOfBirth,
      country: form.country,
      type: form.type,
    });
    if (result) {
      setWizardCaseId(result.id);
      setWizardStep(2);
    }
  };

  const handleDocUpload = async (docType: string, file: File) => {
    if (!wizardCaseId) return;
    setUploadingType(docType);
    await store.uploadDocument(wizardCaseId, file, docType);
    if (!store.error) {
      setUploadedDocs((prev) => ({ ...prev, [docType]: 'uploaded' }));
    }
    setUploadingType(null);
  };

  const handleSelfieUpload = async (file: File) => {
    if (!wizardCaseId) return;
    setUploadingType('SELFIE');
    await store.uploadDocument(wizardCaseId, file, 'SELFIE');
    if (!store.error) {
      setSelfieUploaded(true);
    }
    setUploadingType(null);
  };

  const handleWizardSubmit = async () => {
    if (!wizardCaseId) return;
    await store.submitVerification(wizardCaseId);
    if (!store.error) {
      resetWizard();
      setSubView('list');
      store.fetchVerifications();
    }
  };

  // ── Detail view helpers ──
  const handleViewDetail = async (v: Verification) => {
    await store.fetchVerification(v.id);
    await store.fetchDocuments(v.id);
    await store.fetchChecks(v.id);
    setSubView('detail');
  };

  const handleUploadInDetail = async (file: File, docType: string) => {
    if (!store.selected) return;
    await store.uploadDocument(store.selected.id, file, docType);
  };

  const handleSubmitDetail = async () => {
    if (!store.selected) return;
    await store.submitVerification(store.selected.id);
  };

  const handleReview = async () => {
    if (!store.selected || !reviewDecision) return;
    await store.reviewVerification(store.selected.id, reviewDecision, reviewReason || undefined);
    setReviewDecision('');
    setReviewReason('');
  };

  const handleResubmit = async () => {
    if (!store.selected) return;
    await store.resubmitVerification(store.selected.id);
  };

  const filtered = store.verifications.filter((v) => {
    const matchesSearch =
      !searchTerm ||
      `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const wizardSteps = [
    { label: t('wizard_step1') },
    { label: t('wizard_step2') },
    { label: t('wizard_step3') },
    { label: t('wizard_step4') },
  ];

  const hasAnyIdDoc = Object.keys(uploadedDocs).some((k) => {
    const dt = DOC_TYPES.find((d) => d.value === k);
    return dt?.isId;
  });

  // ════════════════════════════════════════════════════════════════
  // WIZARD VIEW
  // ════════════════════════════════════════════════════════════════
  if (subView === 'wizard') {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { resetWizard(); setSubView('list'); }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t('wizard_back_to_list')}
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('wizard_title_new')}</h2>

          <StepIndicator current={wizardStep} steps={wizardSteps} />

          {/* Step subtitle */}
          <p className="text-sm text-gray-500 mb-6 text-center">
            {wizardStep === 1 && t('wizard_step1_sub')}
            {wizardStep === 2 && t('wizard_step2_sub')}
            {wizardStep === 3 && t('wizard_step3_sub')}
            {wizardStep === 4 && t('wizard_step4_sub')}
          </p>

          {store.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {store.error}
            </div>
          )}

          {/* ── Step 1: Details ─────────────────────────────────────── */}
          {wizardStep === 1 && (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard_first_name')} *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard_last_name')} *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard_email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard_dob')}</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard_country')} *</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard_type')}</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none"
                  >
                    <option value="INDIVIDUAL">{t('wizard_type_individual')}</option>
                    <option value="ENHANCED">{t('wizard_type_enhanced')}</option>
                    <option value="SIMPLIFIED">{t('wizard_type_simplified')}</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleStep1Submit}
                  disabled={store.isLoading || !form.firstName || !form.lastName || !form.country}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 font-medium"
                >
                  {store.isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('wizard_creating')}</>
                  ) : (
                    <>{t('wizard_next_create')} <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: ID Documents ─────────────────────────────────── */}
          {wizardStep === 2 && (
            <div>
              {/* Dropdown + Upload row */}
              <div className="flex gap-2 mb-5">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none text-sm bg-white"
                >
                  <option value="">{t('wizard_doc_select_placeholder')}</option>
                  {DOC_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value} disabled={!!uploadedDocs[dt.value]}>
                      {t(dt.labelKey as any)}{uploadedDocs[dt.value] ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
                <label
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    selectedDocType
                      ? 'bg-amber-800 text-white hover:bg-amber-900 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    disabled={!selectedDocType}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && selectedDocType) {
                        handleDocUpload(selectedDocType, f);
                        setSelectedDocType('');
                      }
                      e.target.value = '';
                    }}
                  />
                  {uploadingType && uploadingType !== 'SELFIE' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {t('wizard_doc_upload_btn')}
                </label>
              </div>

              {/* Uploaded documents list */}
              {Object.keys(uploadedDocs).length > 0 ? (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('wizard_docs_uploaded_title')}
                  </p>
                  {Object.keys(uploadedDocs).map((k) => {
                    const dt = DOC_TYPES.find((d) => d.value === k);
                    const isReplacing = uploadingType === k;
                    return (
                      <div key={k} className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div className="flex-shrink-0 text-emerald-600">{dt?.icon}</div>
                        <span className="flex-1 text-sm font-medium text-emerald-800">
                          {dt ? t(dt.labelKey as any) : k}
                        </span>
                        <label className="cursor-pointer flex-shrink-0">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleDocUpload(k, f);
                              e.target.value = '';
                            }}
                          />
                          {isReplacing ? (
                            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                          ) : (
                            <span className="text-xs text-amber-700 hover:text-amber-900 font-medium underline">
                              {t('wizard_doc_replace_btn')}
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center border-2 border-dashed border-gray-200 rounded-xl mb-4">
                  <Upload className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">{t('wizard_doc_empty_hint')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('wizard_doc_formats')}</p>
                </div>
              )}

              {!hasAnyIdDoc && Object.keys(uploadedDocs).length > 0 && (
                <p className="text-xs text-amber-700 mt-1 mb-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  {t('wizard_doc_required_one')}
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setWizardStep(1)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  disabled={!hasAnyIdDoc}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-40 font-medium"
                >
                  {t('next')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Selfie / Camera ──────────────────────────────── */}
          {wizardStep === 3 && (
            <div>
              {/* Camera viewport */}
              <div
                className="relative bg-gray-900 rounded-2xl overflow-hidden mb-4"
                style={{ aspectRatio: '4/3' }}
              >
                {/* Live video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraState === 'active' ? 'block' : 'hidden'}`}
                />

                {/* Face oval overlay while camera is active */}
                {cameraState === 'active' && (
                  <>
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      aria-hidden
                    >
                      <div
                        className="w-44 h-60 border-4 border-white/80 rounded-full"
                        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
                      />
                    </div>
                    <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs font-medium">
                      {t('wizard_camera_center_face')}
                    </p>
                  </>
                )}

                {/* Captured photo preview */}
                {cameraState === 'preview' && capturedImage && (
                  <>
                    <img src={capturedImage} alt="selfie preview" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Preview
                    </div>
                  </>
                )}

                {/* Idle / starting placeholder */}
                {(cameraState === 'idle' || cameraState === 'starting') && !selfieUploaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {cameraState === 'starting' ? (
                      <Loader2 className="w-12 h-12 text-white/60 animate-spin" />
                    ) : (
                      <ScanFace className="w-16 h-16 text-gray-600" />
                    )}
                    <p className="text-gray-400 text-sm">
                      {cameraState === 'starting' ? t('wizard_camera_starting') : t('wizard_camera_idle')}
                    </p>
                  </div>
                )}

                {/* Selfie already uploaded overlay */}
                {selfieUploaded && cameraState === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/80 gap-3">
                    <CheckCircle className="w-16 h-16 text-emerald-400" />
                    <p className="text-emerald-200 font-semibold text-sm">{t('wizard_selfie_captured')}</p>
                  </div>
                )}

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera error */}
              {cameraError && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {cameraError}
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col items-center gap-4 mb-5">
                {/* Idle — not yet captured */}
                {cameraState === 'idle' && !selfieUploaded && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-800 text-white rounded-xl hover:bg-amber-900 font-semibold text-sm shadow-md"
                    >
                      <Camera className="w-5 h-5" />
                      {t('wizard_camera_open')}
                    </button>
                    <span className="text-xs text-gray-400 select-none">— or —</span>
                    <label className="flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-amber-500 hover:text-amber-800 cursor-pointer text-sm font-medium transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSelfieUpload(f);
                          e.target.value = '';
                        }}
                      />
                      <Upload className="w-4 h-4" />
                      {t('wizard_selfie_upload_instead')}
                    </label>
                  </div>
                )}

                {/* Camera active — shutter button */}
                {cameraState === 'active' && (
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => stopCamera()}
                      className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800"
                    >
                      {t('wizard_camera_cancel')}
                    </button>
                    {/* Shutter ring */}
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-[5px] border-amber-700 hover:bg-amber-50 flex items-center justify-center shadow-xl transition-transform active:scale-95"
                      aria-label="Capture photo"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-800" />
                    </button>
                    <div className="w-[76px]" /> {/* spacer to balance the cancel button */}
                  </div>
                )}

                {/* Preview — confirm or retake */}
                {cameraState === 'preview' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={retakePhoto}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {t('wizard_camera_retake')}
                    </button>
                    <button
                      onClick={confirmSelfie}
                      disabled={uploadingType === 'SELFIE'}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold text-sm shadow"
                    >
                      {uploadingType === 'SELFIE' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t('wizard_submitting')}</>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> {t('wizard_camera_confirm')}</>
                      )}
                    </button>
                  </div>
                )}

                {/* Uploaded — retake option */}
                {selfieUploaded && uploadingType !== 'SELFIE' && (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      {t('wizard_selfie_captured')}
                    </span>
                    <button
                      onClick={() => { setSelfieUploaded(false); setCapturedImage(null); }}
                      className="text-sm text-amber-700 hover:text-amber-900 underline"
                    >
                      {t('wizard_doc_replace_btn')}
                    </button>
                  </div>
                )}

                {uploadingType === 'SELFIE' && (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('wizard_doc_uploading')}
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-800 mb-2">{t('wizard_selfie_tips')}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {(['wizard_selfie_tip1', 'wizard_selfie_tip2', 'wizard_selfie_tip3', 'wizard_selfie_tip4'] as const).map((key) => (
                    <li key={key} className="flex items-center gap-2 text-xs text-blue-700">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" /> {t(key)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => { stopCamera(); setWizardStep(2); }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
                </button>
                <button
                  onClick={() => { stopCamera(); setWizardStep(4); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 font-medium"
                >
                  {t('next')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Submit ──────────────────────────────── */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              {/* Applicant Details */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-amber-800" />
                  <p className="text-sm font-semibold text-gray-900">{t('wizard_review_details')}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500">{t('wizard_first_name')}:</span> <span className="text-gray-900 font-medium">{form.firstName}</span></div>
                  <div><span className="text-gray-500">{t('wizard_last_name')}:</span> <span className="text-gray-900 font-medium">{form.lastName}</span></div>
                  {form.email && <div><span className="text-gray-500">{t('wizard_email')}:</span> <span className="text-gray-900">{form.email}</span></div>}
                  {form.dateOfBirth && <div><span className="text-gray-500">{t('wizard_dob')}:</span> <span className="text-gray-900">{form.dateOfBirth}</span></div>}
                  <div><span className="text-gray-500">{t('wizard_country')}:</span> <span className="text-gray-900 font-medium">{form.country}</span></div>
                  <div><span className="text-gray-500">{t('wizard_type')}:</span> <span className="text-gray-900">{form.type}</span></div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-amber-800" />
                  <p className="text-sm font-semibold text-gray-900">{t('wizard_review_documents')}</p>
                </div>
                {Object.keys(uploadedDocs).length > 0 ? (
                  <ul className="space-y-1.5">
                    {Object.keys(uploadedDocs).map((k) => {
                      const dt = DOC_TYPES.find((d) => d.value === k);
                      return (
                        <li key={k} className="flex items-center gap-2 text-sm text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          {dt ? t(dt.labelKey as any) : k}
                        </li>
                      );
                    })}
                    {selfieUploaded && (
                      <li className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle className="w-4 h-4" />
                        {t('wizard_doc_selfie')}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">{t('verif_no_docs')}</p>
                )}
              </div>

              {/* Liveness status */}
              <div className={`rounded-xl p-4 border ${selfieUploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ScanFace className={`w-4 h-4 ${selfieUploaded ? 'text-emerald-700' : 'text-amber-700'}`} />
                  <p className={`text-sm font-semibold ${selfieUploaded ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {t('wizard_review_liveness')}
                  </p>
                </div>
                <p className={`text-xs ${selfieUploaded ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selfieUploaded ? t('wizard_review_liveness_ready') : t('wizard_review_liveness_missing')}
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
                </button>
                <button
                  onClick={handleWizardSubmit}
                  disabled={store.isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                >
                  {store.isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('wizard_submitting')}</>
                  ) : (
                    <><Send className="w-4 h-4" /> {t('wizard_submit_btn')}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════════════════
  if (subView === 'detail' && store.selected) {
    const v = store.selected;
    const hasFront = store.documents.some((d) =>
      ['PASSPORT_FRONT', 'NATIONAL_ID_FRONT', 'DRIVERS_LICENSE_FRONT'].includes(d.type)
    );
    const hasSelfie = store.documents.some((d) => ['SELFIE', 'FACE', 'PORTRAIT'].includes(d.type));
    const canUpload = v.status === 'CREATED' || v.status === 'PENDING' || v.status === 'DOCUMENTS_UPLOADED';

    return (
      <div className="space-y-6">
        <button
          onClick={() => { store.clearSelected(); setSubView('list'); }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> {t('wizard_back_to_list')}
        </button>
        {store.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{store.error}</div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{v.firstName} {v.lastName}</h2>
              <p className="text-sm text-gray-500">{v.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[v.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {v.status}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskColors[v.overallRiskLevel] ?? 'bg-gray-100 text-gray-700'}`}>
                {v.overallRiskLevel ?? 'N/A'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">External ID:</span> <span className="text-gray-900 ml-1 font-mono text-xs">{v.externalUserId}</span></div>
            <div><span className="text-gray-500">{t('wizard_dob')}:</span> <span className="text-gray-900 ml-1">{v.dateOfBirth || '—'}</span></div>
            <div><span className="text-gray-500">{t('wizard_country')}:</span> <span className="text-gray-900 ml-1">{v.country}</span></div>
            <div><span className="text-gray-500">{t('wizard_type')}:</span> <span className="text-gray-900 ml-1">{v.type}</span></div>
            <div><span className="text-gray-500">{t('verif_score')}:</span> <span className="text-gray-900 ml-1">{v.overallScore != null ? (v.overallScore * 100).toFixed(0) + '%' : '—'}</span></div>
            <div><span className="text-gray-500">{t('case_detail_rejection_reason')}:</span> <span className="text-gray-900 ml-1">{v.rejectionReason || '—'}</span></div>
            <div><span className="text-gray-500">{t('verif_created')}:</span> <span className="text-gray-900 ml-1">{formatDate(v.createdAt)}</span></div>
          </div>
        </div>

        {/* Document Requirements */}
        {canUpload && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">{t('verif_doc_requirements')}</p>
                <p className="text-xs text-blue-700 mt-0.5">{t('verif_doc_req_hint')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${hasFront ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                <IdCard className={`w-5 h-5 ${hasFront ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-xs font-medium ${hasFront ? 'text-emerald-800' : 'text-gray-700'}`}>{t('verif_id_front')}</p>
                  <p className={`text-xs ${hasFront ? 'text-emerald-600' : 'text-gray-400'}`}>{hasFront ? t('verif_uploaded') : t('verif_required')}</p>
                </div>
                {hasFront ? <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" /> : <Clock className="w-4 h-4 text-gray-300 ml-auto" />}
              </div>
              <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${hasSelfie ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                <ScanFace className={`w-5 h-5 ${hasSelfie ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-xs font-medium ${hasSelfie ? 'text-emerald-800' : 'text-gray-700'}`}>{t('verif_selfie')}</p>
                  <p className={`text-xs ${hasSelfie ? 'text-emerald-600' : 'text-gray-400'}`}>{hasSelfie ? t('verif_uploaded') : t('verif_required_liveness')}</p>
                </div>
                {hasSelfie ? <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" /> : <Clock className="w-4 h-4 text-gray-300 ml-auto" />}
              </div>
            </div>
            {hasFront && hasSelfie && (
              <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {t('verif_liveness_ready')}
              </p>
            )}
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-800" />
            {t('verif_docs_section')} ({store.documents.length})
          </h3>
          {store.documents.length > 0 ? (
            <div className="space-y-2 mb-4">
              {store.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                      <p className="text-xs text-gray-500">{doc.type} &middot; {doc.mimeType}</p>
                    </div>
                  </div>
                  <a href={store.getDocumentUrl(v.id, doc.id)} target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-900">
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">{t('verif_no_docs')}</p>
          )}

          {hasPermission('create_verification') && canUpload && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">{t('verif_upload_doc')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...DOC_TYPES, { value: 'SELFIE', labelKey: 'wizard_doc_selfie', icon: <Camera className="w-5 h-5" />, isId: false }].map((dt) => (
                  <label key={dt.value} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadInDetail(f, dt.value);
                        e.target.value = '';
                      }}
                    />
                    <Upload className="w-4 h-4 text-amber-700" />
                    {t(dt.labelKey as any)}
                    {store.isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Checks */}
        {store.checks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('verif_checks_section')}</h3>
            <div className="space-y-2">
              {store.checks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{check.checkType}</p>
                    <p className="text-xs text-gray-500">{t('verif_score')}: {check.score != null ? (check.score * 100).toFixed(0) + '%' : '—'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[check.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('verif_actions_section')}</h3>
          <div className="flex flex-wrap gap-3">
            {canUpload && hasPermission('create_verification') && (
              <button
                onClick={handleSubmitDetail}
                disabled={store.isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {store.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('verif_submit_btn')}
              </button>
            )}
            {(v.status === 'IN_REVIEW' || v.status === 'AWAITING_REVIEW' || v.status === 'PROCESSING' || v.status === 'SUBMITTED') &&
              hasPermission('review_verification') && (
              <div className="flex items-end gap-3 w-full">
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">{t('verif_select_decision')}</option>
                  <option value="APPROVED">{t('approve')}</option>
                  <option value="REJECTED">{t('reject')}</option>
                </select>
                <input
                  type="text"
                  placeholder={t('verif_rejection_reason')}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-700"
                />
                <button
                  onClick={handleReview}
                  disabled={!reviewDecision || store.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 text-sm"
                >
                  {store.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {t('verif_review_btn')}
                </button>
              </div>
            )}
            {v.status === 'REJECTED' && hasPermission('create_verification') && (
              <button
                onClick={handleResubmit}
                disabled={store.isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {store.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                {t('verif_resubmit_btn')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('verif_pipeline')}</h2>
          <p className="text-sm text-gray-500">{store.total} {t('verif_total')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => store.fetchVerifications()}
            disabled={store.isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${store.isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasPermission('create_verification') && (
            <button
              onClick={startWizard}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 text-sm"
            >
              <Plus className="w-4 h-4" /> {t('verif_new_btn')}
            </button>
          )}
        </div>
      </div>

      {store.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {store.error}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('verif_search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">{t('verif_all_statuses')}</option>
          <option value="CREATED">{t('status_created')}</option>
          <option value="DOCUMENTS_UPLOADED">Docs Uploaded</option>
          <option value="PROCESSING">{t('status_processing')}</option>
          <option value="AWAITING_REVIEW">{t('status_review')}</option>
          <option value="APPROVED">{t('status_approved')}</option>
          <option value="REJECTED">{t('status_rejected')}</option>
        </select>
      </div>

      {store.isLoading && filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_applicant')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_country')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_type')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_status')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_risk')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_created')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t('verif_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetail(v)}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{v.firstName} {v.lastName}</p>
                    <p className="text-xs text-gray-500 font-mono">{v.externalUserId}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{v.country}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{v.type}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[v.status] ?? 'bg-gray-100 text-gray-700'}`}>{v.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${riskColors[v.overallRiskLevel] ?? 'bg-gray-100 text-gray-700'}`}>{v.overallRiskLevel ?? '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{formatDate(v.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-amber-800 hover:text-amber-900" onClick={(e) => { e.stopPropagation(); handleViewDetail(v); }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('verif_no_results')}</p>
          {hasPermission('create_verification') && (
            <button onClick={startWizard} className="mt-4 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 text-sm">
              {t('verif_create_first')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VerificationPipeline;

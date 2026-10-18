import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertTriangle,
  Calendar,
  Layers,
  MapPin,
  FileText,
  Loader2,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Item, ItemCategory, OcrExtractionResult } from '../types/index.ts';
import { SAMPLE_LABELS } from '../data/sampleLabels.ts';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: Item) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  
  // OCR Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<OcrExtractionResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Groceries');
  const [subCategory, setSubCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('unit');
  const [location, setLocation] = useState('Fridge');
  const [notes, setNotes] = useState('');
  const [storageTips, setStorageTips] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setScanError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      runOcrAnalysis(base64);
    };
    reader.onerror = () => {
      setScanError('Failed to read selected image.');
    };
    reader.readAsDataURL(file);
  };

  // Run AI OCR on image data URL
  const runOcrAnalysis = async (base64Image: string) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const res = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan label with AI');
      }

      const result: OcrExtractionResult = data.data;
      setScanResult(result);

      // Pre-fill form fields
      setName(result.productName);
      setBrand(result.brand || '');
      setCategory(result.category);
      setSubCategory(result.subCategory || '');
      setExpiryDate(result.expiryDate);
      if (result.storageRecommendation) {
        setStorageTips(result.storageRecommendation);
      }
      if (result.notes) {
        setNotes(result.notes);
      }

      // Default smart location based on category
      if (result.category === 'Medicine') {
        setLocation('Medicine Cabinet');
      } else if (result.category === 'Cosmetics') {
        setLocation('Bathroom');
      } else if (result.category === 'Pantry') {
        setLocation('Pantry');
      } else if (result.storageRecommendation.toLowerCase().includes('refrigerat') || result.storageRecommendation.toLowerCase().includes('chill')) {
        setLocation('Fridge');
      }
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'Error processing image.');
    } finally {
      setIsScanning(false);
    }
  };

  // Convert an online image URL to base64 for sample testing
  const handleSelectSample = async (sampleUrl: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        runOcrAnalysis(base64);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setScanError('Could not load sample image: ' + err.message);
      setIsScanning(false);
    }
  };

  // Camera capture support
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setScanError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setScanError('Camera access denied or unavailable: ' + err.message);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      setImagePreview(dataUri);
      runOcrAnalysis(dataUri);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Helper date adder
  const addDaysToDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name');
      return;
    }
    if (!expiryDate) {
      alert('Please specify an expiry date');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        brand,
        category,
        subCategory,
        expiryDate,
        purchaseDate,
        quantity,
        unit,
        location,
        notes,
        storageTips,
        imageURL: imagePreview || '',
        rawOcrText: scanResult?.rawOcrText || '',
        aiConfidence: scanResult?.confidence || 'high',
      };

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save item');
      }

      onItemAdded(data.item);
      handleModalClose();
    } catch (err: any) {
      alert(err.message || 'Error saving item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Item</h2>
              <p className="text-xs text-slate-500">Scan product label with AI or enter manually</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('scan');
              stopCamera();
            }}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'scan'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>AI Label Scanner (OCR)</span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800">
              Smart
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manual Form</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: AI SCAN */}
          {activeTab === 'scan' && (
            <div className="space-y-5">
              
              {/* Camera or Drop Area */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-xs font-semibold px-2 py-1 bg-black/60 text-emerald-300 rounded backdrop-blur">
                      Position expiry label inside box
                    </span>
                  </div>
                  <div className="absolute bottom-4 inset-x-0 flex justify-center space-x-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg flex items-center space-x-2 text-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture & Analyze</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Drag-and-drop / Upload box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) processFile(file);
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                      imagePreview
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/10 bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <input
                      ref={mobileCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {imagePreview ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-md border border-slate-200 mb-3 bg-white">
                          <img
                            src={imagePreview}
                            alt="Label Preview"
                            className="w-full h-full object-cover"
                          />
                          {isScanning && (
                            <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                              <span className="text-xs font-semibold tracking-wide uppercase text-emerald-200 animate-pulse">
                                Extracting OCR...
                              </span>
                              {/* Animated Laser Scan line */}
                              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_1.5s_infinite]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                          Click to select a different image
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                          <Camera className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Snap or upload product label
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            AI reads expiration dates from cartons, bottles, boxes & tubes
                          </p>
                        </div>
                        
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          {/* Snap with Phone Camera */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              mobileCameraInputRef.current?.click();
                            }}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Take Photo with Phone</span>
                          </button>

                          {/* Upload File */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-600" />
                            <span>Browse Gallery</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick-test Presets */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Quick Test: Select a Sample Label to Scan
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SAMPLE_LABELS.slice(0, 3).map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => handleSelectSample(sample.imageUrl)}
                          disabled={isScanning}
                          className="flex items-center space-x-2 p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition group disabled:opacity-50"
                        >
                          <img
                            src={sample.imageUrl}
                            alt={sample.name}
                            className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                              {sample.name.split(' ')[0]} {sample.name.split(' ')[1]}
                            </p>
                            <span className="text-[10px] text-slate-500 capitalize">
                              {sample.category}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {scanError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Scan extraction feedback card */}
              {scanResult && !isScanning && (
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      AI OCR Extracted Details
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 capitalize">
                      {scanResult.confidence} Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Product:</span>
                      <strong className="text-slate-800">{scanResult.productName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Expiration Date:</span>
                      <strong className="text-emerald-700 font-mono text-sm">{scanResult.expiryDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Category:</span>
                      <span className="font-medium text-slate-700">{scanResult.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Detected Text:</span>
                      <span className="text-slate-600 font-mono truncate block" title={scanResult.rawOcrText}>
                        {scanResult.rawOcrText || 'Standard packaging stamp'}
                      </span>
                    </div>
                  </div>

                  {scanResult.storageRecommendation && (
                    <div className="pt-1 border-t border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                      <span><strong>Storage Tip:</strong> {scanResult.storageRecommendation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form fields (always visible or populated by OCR for confirmation) */}
          <form id="item-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Organic Whole Milk, Amoxicillin 500mg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Horizon, Pfizer, CeraVe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900 bg-white"
                >
                  <option value="Groceries">Groceries (Perishables/Produce)</option>
                  <option value="Medicine">Medicine & Health</option>
                  <option value="Cosmetics">Cosmetics & Skincare</option>
                  <option value="Pantry">Pantry & Dry Goods</option>
                  <option value="Household">Household & Cleaning</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Expiry Date */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  {/* Quick date shortcuts */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addDaysToDate(3)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => addDaysToDate(7)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      +1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => addDaysToDate(30)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      +1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => addDaysToDate(180)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      +6 Months
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="carton, bottle, pcs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Storage Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900 bg-white"
                >
                  <option value="Fridge">Fridge</option>
                  <option value="Freezer">Freezer</option>
                  <option value="Pantry">Pantry / Cabinet</option>
                  <option value="Medicine Cabinet">Medicine Cabinet</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Countertop">Countertop</option>
                </select>
              </div>

              {/* Notes or Storage Advice */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes & Storage Tips
                </label>
                <input
                  type="text"
                  value={storageTips || notes}
                  onChange={(e) => {
                    setStorageTips(e.target.value);
                    setNotes(e.target.value);
                  }}
                  placeholder="e.g. Keep chilled below 4°C, finish within 5 days of opening"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900"
                />
              </div>

            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={handleModalClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="item-form"
            disabled={isSubmitting || isScanning}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-emerald-500/20 disabled:opacity-50 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Item...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save to Inventory</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

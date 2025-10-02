import React, { useState, useRef } from 'react';

const DatasheetUpload = ({ onUploadComplete, isVisible }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadedSheets, setUploadedSheets] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        const uploadResults = [];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('datasheet', file);
                formData.append('manufacturer', extractManufacturerFromFilename(file.name));
                formData.append('model', extractModelFromFilename(file.name));

                const response = await fetch('/api/upload-datasheet', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    uploadResults.push({
                        filename: file.name,
                        manufacturer: result.extracted_specifications?.manufacturer || 'Unknown',
                        model: result.extracted_specifications?.model || 'Unknown',
                        specifications: result.extracted_specifications,
                        success: true
                    });
                } else {
                    uploadResults.push({
                        filename: file.name,
                        error: result.error || 'Unknown error occurred',
                        success: false
                    });
                }
            } catch (error) {
                uploadResults.push({
                    filename: file.name,
                    error: error.message,
                    success: false
                });
            }
        }

        setUploadedSheets(prev => [...prev, ...uploadResults]);
        setUploading(false);
        
        if (onUploadComplete) {
            onUploadComplete(uploadResults);
        }
    };

    const extractManufacturerFromFilename = (filename) => {
        // Simple extraction logic - can be enhanced
        const manufacturers = ['Tesla', 'BYD', 'CATL', 'Samsung', 'LG', 'Panasonic', 'Fluence', 'Wartsila'];
        const upperFilename = filename.toUpperCase();
        
        for (const manufacturer of manufacturers) {
            if (upperFilename.includes(manufacturer.toUpperCase())) {
                return manufacturer;
            }
        }
        return '';
    };

    const extractModelFromFilename = (filename) => {
        // Extract potential model number from filename
        const modelMatch = filename.match(/([A-Z0-9\-]+(?:\s+[A-Z0-9\-]+)*)/i);
        return modelMatch ? modelMatch[1] : '';
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(Array.from(e.target.files));
        }
    };

    const clearUploads = () => {
        setUploadedSheets([]);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'rgba(249, 249, 249, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: '32px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                border: '1px solid rgba(229, 231, 235, 0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '24px',
                        color: '#2d3428',
                        fontWeight: '700'
                    }}>
                        Upload BESS Datasheets
                    </h2>
                    <button
                        onClick={() => onUploadComplete && onUploadComplete(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragActive ? '#4ade80' : '#d1d5db'}`,
                        borderRadius: '12px',
                        padding: '48px 24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: dragActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(249, 249, 249, 0.5)',
                        transition: 'all 0.3s ease',
                        marginBottom: '24px'
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                    <p style={{ 
                        fontSize: '18px', 
                        color: '#374151', 
                        margin: '0 0 8px 0',
                        fontWeight: '600'
                    }}>
                        {dragActive ? 'Drop files here' : 'Click to upload or drag & drop'}
                    </p>
                    <p style={{ 
                        fontSize: '14px', 
                        color: '#6b7280', 
                        margin: 0 
                    }}>
                        PDF, DOCX, or TXT files (max 10MB each)
                        <br />
                        <small>Note: PDF text extraction is basic - TXT format recommended for best results</small>
                    </p>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                {uploading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#4ade80',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>
                        <div style={{ marginBottom: '8px' }}>🔄 Processing datasheets...</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            Extracting specifications and updating database
                        </div>
                    </div>
                )}

                {uploadedSheets.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                color: '#2d3428',
                                fontWeight: '600'
                            }}>
                                Upload Results ({uploadedSheets.length})
                            </h3>
                            <button
                                onClick={clearUploads}
                                style={{
                                    background: 'none',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                Clear
                            </button>
                        </div>
                        
                        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                            {uploadedSheets.map((sheet, index) => (
                                <div key={index} style={{
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    backgroundColor: sheet.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ fontSize: '16px', marginRight: '8px' }}>
                                            {sheet.success ? '✅' : '❌'}
                                        </span>
                                        <strong style={{ fontSize: '14px', color: '#374151' }}>
                                            {sheet.filename}
                                        </strong>
                                    </div>
                                    
                                    {sheet.success ? (
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            <div>{sheet.manufacturer} {sheet.model}</div>
                                            {sheet.specifications?.nominal_power_mw && (
                                                <div>Power: {sheet.specifications.nominal_power_mw}MW</div>
                                            )}
                                            {sheet.specifications?.nominal_energy_mwh && (
                                                <div>Energy: {sheet.specifications.nominal_energy_mwh}MWh</div>
                                            )}
                                            {sheet.specifications?.chemistry && (
                                                <div>Chemistry: {sheet.specifications.chemistry}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '12px', color: '#ef4444' }}>
                                            Error: {sheet.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <h4 style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        color: '#1e40af',
                        fontWeight: '600'
                    }}>
                        💡 Tips for Better Results
                    </h4>
                    <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        fontSize: '14px',
                        color: '#374151'
                    }}>
                        <li>Include manufacturer name in filename (e.g., "Tesla_Megapack_2024.pdf")</li>
                        <li>Upload complete technical datasheets with specifications</li>
                        <li>Ensure text is readable (not scanned images)</li>
                        <li>Include key specs: power, energy, chemistry, efficiency</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DatasheetUpload;
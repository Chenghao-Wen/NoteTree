import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faCheck,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// File item type definition
interface FileItem {
  id: number | string;
  file: File;
  name: string;
  selected: boolean;
  previewUrl: string | null;
  type: string;
}

// Component props type definition
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

// File upload modal component
const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      id: Date.now() + Math.random(), // unique ID
      file,
      name: file.name,
      selected: false,
      previewUrl: file.type.includes("pdf") ? URL.createObjectURL(file) : null,
      type: file.type, // get type from original file object
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Open file selector dialog
  const openFileSelector = (): void => {
    fileInputRef.current?.click();
  };

  // Toggle file selection state
  const toggleFileSelection = (fileId: number | string): void => {
    setSelectedFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId ? { ...file, selected: !file.selected } : file
      )
    );
  };

  // Toggle select all state
  const toggleSelectAll = (): void => {
    const newSelectedAll = !selectedAll;
    setSelectedAll(newSelectedAll);
    setSelectedFiles((prevFiles) =>
      prevFiles.map((file) => ({ ...file, selected: newSelectedAll }))
    );
  };

  // Update file name
  const updateFileName = (fileId: number | string, newName: string): void => {
    setSelectedFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId ? { ...file, name: newName } : file
      )
    );
  };

  // Preview PDF files
  const previewFile = (file: FileItem): void => {
    if (file.previewUrl) {
      window.open(file.previewUrl, "_blank");
    }
  };

  // Handle upload
  const handleUpload = (): void => {
    const filesToUpload = selectedFiles.filter((file) => file.selected);
    if (filesToUpload.length === 0) {
      alert("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/files/upload", true);

    // Monitor upload progress
    xhr.upload.onprogress = (progressEvent: ProgressEvent): void => {
      if (progressEvent.lengthComputable) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      }
    };

    // Request completion handler
    xhr.onload = (): void => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          console.log("Upload success:", result);
          onUploadComplete?.();
          setSelectedFiles([]);
          setSelectedAll(false);
          onClose();
        } catch (error) {
          console.error("Failed to parse response:", error);
          alert("Upload failed, please try again");
        }
      } else {
        console.error("Upload failed:", xhr.statusText);
        alert("Upload failed, please try again");
      }
      setIsUploading(false);
    };

    // Request error handler
    xhr.onerror = (): void => {
      console.error("Upload error:", xhr.statusText);
      alert("Upload failed, please try again");
      setIsUploading(false);
    };

    // Prepare form data
    const formData = new FormData();
    filesToUpload.forEach((file, index) => {
      formData.append("files", file.file, file.name);
    });

    // Send request
    xhr.send(formData);
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  return (
    isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* background overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* modal content */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* modal header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">File Upload</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* modal body */}
          <div className="flex-1 overflow-auto p-4">
            {/* select file button */}
            <div className="mb-6">
              <button
                onClick={openFileSelector}
                className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                Select Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,.jpg,.png,.docx,.txt,.doc,.docxx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* file list */}
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                {/* select all control */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedAll}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="selectAll" className="ml-2 text-gray-700">
                    Select All
                  </label>
                </div>

                {/* file list */}
                {selectedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center p-3 border rounded-lg ${
                      file.selected
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200"
                    } transition-all hover:shadow-md`}
                  >
                    {/* selection box */}
                    <input
                      type="checkbox"
                      checked={file.selected}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                    />

                    {/* file icon */}
                    <FontAwesomeIcon
                      icon={faFilePdf}
                      className={`ml-3 text-2xl ${
                        file.type?.includes("pdf")
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    />

                    {/* file name input */}
                    <div className="flex-1 ml-4">
                      <input
                        type="text"
                        value={file.name}
                        onChange={(e) =>
                          updateFileName(file.id, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>

                    {/* preview button */}
                    <button
                      onClick={() => previewFile(file)}
                      disabled={!file.previewUrl}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        file.previewUrl
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      } transition-all`}
                    >
                      <FontAwesomeIcon icon={faSpinner} className="mr-1" />
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <FontAwesomeIcon icon={faFilePdf} className="text-4xl mb-3" />
                <p>No files selected yet</p>
              </div>
            )}
          </div>

          {/* modal footer */}
          <div className="p-4 border-t flex justify-between items-center">
            {/* upload progress */}
            {isUploading && (
              <div className="w-full max-w-md mr-4">
                <div className="text-sm text-gray-700 mb-1">
                  Upload progress: {uploadProgress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  selectedFiles.filter((f) => f.selected).length === 0 ||
                  isUploading
                }
                className={`px-5 py-2.5 bg-primary text-white rounded-lg ${
                  isUploading ||
                  selectedFiles.filter((f) => f.selected).length === 0
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-primary/90"
                } transition-all`}
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                    Confirm Upload
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default FileUploadModal;

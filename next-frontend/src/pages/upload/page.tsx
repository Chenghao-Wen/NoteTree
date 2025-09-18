"use client";
import React, { useState } from "react";
// Import FileUploadModal component (adjust the path as needed)
import FileUploadModal from "@/components/UploadWindow"; // assumed to be in components directory

const FileManagementPage: React.FC = () => {
  // 1. State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. Function to open modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // 3. Function to close modal (passed to modal's onClose)
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 4. Optional callback after upload completes (implement as needed)
  const handleUploadComplete = () => {
    console.log("File upload completed — you can refresh file list here");
    // e.g.: re-fetch the file list, show a success message, etc.
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">File Management</h1>

      {/* Trigger button for modal */}
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Upload New File
      </button>

      {/* 5. Render FileUploadModal component */}
      <FileUploadModal
        isOpen={isModalOpen} // Control modal visibility
        onClose={handleCloseModal} // Modal close callback
        onUploadComplete={handleUploadComplete} // Optional upload-complete callback
      />

      {/* Other page content (e.g., file list) */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Uploaded Files</h2>
        {/* Here you can render file list... */}
      </div>
    </div>
  );
};

export default FileManagementPage;

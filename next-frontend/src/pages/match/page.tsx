"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faCheck,
  faTimes,
  faTrash,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// Define file information interface
interface FileItem {
  filePath: string;
  originalName: string;
  fileName: string;
  updateDate: string;
  // Add more fields as needed (e.g., fileSize, fileType, etc.)
}

// Define match result interface
interface MatchResult {
  filePath: string;
  originalName: string;
  matchedParents: string[]; // List of matched parent nodes
  selectedNode: string | null;
  selected: boolean; // Whether this match result is selected
}

// File management page component
const FileManagementPage: React.FC = () => {
  // State definitions (with type annotations)
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedAll, setSelectedAll] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);

  // Initialize and load file list
  useEffect(() => {
    fetchFileList();
  }, []);

  // Fetch unmatched file list
  const fetchFileList = async (): Promise<void> => {
    try {
      setIsLoading(true);
      //   const response = await fetch("http://localhost:5000/files/unmatched");

  //   if (!response.ok) {
  //     throw new Error("Failed to fetch file list");
  //   }

  //   const data = await response.json();
  //   // Assume the API returns { unmatchedRecords: FileItem[] }

  //   setFileList(data.unmatchedRecords as FileItem[]);
      const data = [
        {
          updateDate: "2025-07-25T18:12:28.602Z",
          fileName: "1753467148593.pdf",
          originalName: "mscs_experience_2023.pdf",
          filePath: "uploads\\chenghao\\1753467148593.pdf",
          matched: false,
        },
        {
          updateDate: "2025-07-25T18:12:28.602Z",
          fileName: "1753467148593.pdf",
          originalName: "mscs_experience_2023_copy.pdf",
          filePath: "uploads\\chenghao\\1753467148.pdf",
          matched: false,
        },
        {
          updateDate: "2025-07-25T18:12:28.602Z",
          fileName: "1753467148593.pdf",
          originalName: "mscs_experience_2023_dup.pdf",
          filePath: "uploads\\chenghao\\123456.pdf",
          matched: false,
        },
      ];
      setFileList(data as FileItem[]);
    } catch (error) {
      console.error("Error fetching file list:", error);
      alert("Failed to fetch file list, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle individual file selection
  const toggleFileSelection = (filePath: string): void => {
    if (selectedFiles.includes(filePath)) {
      setSelectedFiles(selectedFiles.filter((path) => path !== filePath));
    } else {
      setSelectedFiles([...selectedFiles, filePath]);
    }
  };

  // Toggle select all
  const toggleSelectAll = (): void => {
    if (selectedAll) {
      setSelectedFiles([]);
      setSelectedAll(false);
    } else {
      setSelectedFiles(fileList.map((file) => file.filePath));
      setSelectedAll(true);
    }
  };

  // Delete file
  const deleteFile = async (filePath: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/files/deleteunmatchedfile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filePath }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Update list (remove deleted file)
      setFileList((prev) => prev.filter((file) => file.filePath !== filePath));
      setSelectedFiles((prev) => prev.filter((path) => path !== filePath));
      alert("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file, please try again");
    }
  };

  // Preview file
  const previewFile = async (filePath: string): Promise<void> => {
    try {
      const response = await fetch("http://localhost:5000/files/fetchbypath", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewFileUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Error previewing file:", error);
      alert("Failed to preview file, please try again");
    }
  };

  // Close file preview
  const closePreview = (): void => {
    if (previewFileUrl) {
      URL.revokeObjectURL(previewFileUrl);
      setPreviewFileUrl(null);
    }
    setIsPreviewOpen(false);
  };

  // Match selected files
  const matchFiles = async (): Promise<void> => {
    if (selectedFiles.length === 0) {
      alert("Please select files to match");
      return;
    }

    try {
      setIsLoading(true);
      // Batch match requests
      const matchRequests = selectedFiles.map((filePath) =>
        fetch("http://localhost:5000/files/matchfiletograph", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filePath }),
        })
      );

      const responses = await Promise.all(matchRequests);
      const results: MatchResult[] = await Promise.all(
        responses.map(async (res) => {
          if (!res.ok) {
            throw new Error("Match failed");
          }
          const data = await res.json();
          const file = fileList.find((f) => f.filePath === data.filePath);

          return {
            ...data,
            originalName: file?.originalName || data.filePath,
            selectedNode: data.matchedParents[0] || null,
            selected: true, // Default selected
          } as MatchResult;
        })
      );

      setMatchResults(results);
      setIsMatchModalOpen(true);
    } catch (error) {
      console.error("Error matching files:", error);
      alert("Failed to match files, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle file selection in match results
  const toggleMatchFileSelection = (filePath: string): void => {
    setMatchResults((prev) =>
      prev.map((result) =>
        result.filePath === filePath
          ? { ...result, selected: !result.selected }
          : result
      )
    );
  };

  // Select all / Deselect all in match results
  const toggleMatchSelectAll = (): void => {
    const allSelected = matchResults.every((result) => result.selected);
    setMatchResults((prev) =>
      prev.map((result) => ({ ...result, selected: !allSelected }))
    );
  };

  // Update selected node in match results
  const updateSelectedNode = (filePath: string, nodeName: string): void => {
    setMatchResults((prev) =>
      prev.map((result) =>
        result.filePath === filePath
          ? { ...result, selectedNode: nodeName }
          : result
      )
    );
  };

  // Confirm match results
  const confirmMatchResults = async (): Promise<void> => {
    const selectedResults = matchResults.filter((result) => result.selected);
    if (selectedResults.length === 0) {
      alert("Please select match results to confirm");
      return;
    }

    try {
      setIsLoading(true);
      // Batch confirm match results
      const confirmRequests = selectedResults.map((result) =>
        fetch("http://localhost:5000/graph/addnode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: result.filePath,
            parentName: result.selectedNode,
            childName: result.originalName,
          }),
        })
      );

      await Promise.all(confirmRequests);
      alert("Match results confirmed");
      setIsMatchModalOpen(false);
      fetchFileList(); // Refresh file list
      setSelectedFiles([]); // Clear selection
    } catch (error) {
      console.error("Error confirming match results:", error);
      alert("Failed to confirm match results, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Unmatched Files</h1>

        {/* File list display */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-2xl text-gray-500"
            />
          </div>
        ) : fileList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faFilePdf} className="text-4xl mb-3" />
            <p>No unmatched files</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* File list header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAll}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="ml-2 text-gray-700">Select All</span>
              </div>
              <button
                onClick={matchFiles}
                disabled={selectedFiles.length === 0}
                className={`px-5 py-2 bg-primary text-white rounded-lg shadow-md ${
                  selectedFiles.length === 0
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-primary/90"
                } transition-all`}
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Match Selected Files
              </button>
            </div>

            {/* File list content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Update Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileList.map((file) => (
                    <tr
                      key={file.filePath}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.filePath)}
                          onChange={() => toggleFileSelection(file.filePath)}
                          className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faFilePdf}
                            className="text-red-500 mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {file.originalName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {file.fileName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.updateDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => previewFile(file.filePath)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <FontAwesomeIcon icon={faFilePdf} /> Preview
                          </button>
                          <button
                            onClick={() => deleteFile(file.filePath)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PDF preview modal */}
      {isPreviewOpen && previewFileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePreview}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">File Preview</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <embed
                src={previewFileUrl}
                type="application/pdf"
                className="w-full min-h-[600px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Match result confirmation modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMatchModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Match Result Confirmation
              </h3>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg mb-4">
                <input
                  type="checkbox"
                  checked={matchResults.every((result) => result.selected)}
                  onChange={toggleMatchSelectAll}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label className="ml-2 text-gray-700">Select All</label>
              </div>

              {matchResults.map((result) => (
                <div
                  key={result.filePath}
                  className={`flex flex-col p-3 border rounded-lg ${
                    result.selected
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  } mb-3 transition-all`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={result.selected}
                      onChange={() => toggleMatchFileSelection(result.filePath)}
                      className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span className="ml-2 text-gray-700">
                      {result.originalName}
                    </span>
                  </div>
                  <div className="mt-2 ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Matching Node:
                    </label>
                    <select
                      value={result.selectedNode || ""}
                      onChange={(e) =>
                        updateSelectedNode(result.filePath, e.target.value)
                      }
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      {result.matchedParents.map((node) => (
                        <option key={node} value={node}>
                          {node}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors mr-3"
              >
                Cancel
              </button>
              <button
                onClick={confirmMatchResults}
                className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Confirm Match Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagementPage;

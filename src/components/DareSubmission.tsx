import React, { useState } from 'react';

interface DareSubmissionProps {
  onComplete: (imageUrl: string) => void;
  uploadToS3: (file: File) => Promise<string>;
}

export function DareSubmission({ onComplete, uploadToS3 }: DareSubmissionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size restriction: 3MB
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 3MB.');
      return;
    }

    try {
      setIsUploading(true);
      setError(undefined);

      // Upload to S3 and get the public URL
      const s3Url = await uploadToS3(file);
      await onComplete(s3Url);
    } catch (err) {
      setError('Failed to upload media. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        disabled={isUploading}
        className="hidden"
        id="media-upload"
      />
      <label
        htmlFor="media-upload"
        className={`inline-block px-6 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
          isUploading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Proof'}
      </label>
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
} 
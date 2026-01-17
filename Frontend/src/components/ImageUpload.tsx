import { useRef } from 'react';
import './ImageUpload.css';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (id: string) => void;
}

function ImageUpload({ images, onAddImages, onRemoveImage }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddImages(e.target.files);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-section">
      <div className="images-grid">
        {images.map((image) => (
          <div key={image.id} className="image-card">
            <img src={image.preview} alt="Uploaded" className="uploaded-image" />
            <button
              className="remove-button"
              onClick={() => onRemoveImage(image.id)}
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ))}
        
        <div className="add-image-card" onClick={handleAddClick}>
          <div className="add-icon">+</div>
          <span className="add-text">Add Image</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="file-input"
      />

      <button className="add-images-button" onClick={handleAddClick}>
        Add images
      </button>
    </div>
  );
}

export default ImageUpload;

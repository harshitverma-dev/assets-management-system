import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { updateAsset, fetchAssets } from '../store/assetsSlice';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, className, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad && onLoad();
  };

  const handleError = (e) => {
    setHasError(true);
    onError && onError(e);
  };

  return (
    <div ref={imgRef} className={`relative w-full h-20 bg-gray-100 ${className}`}>
      {!isInView && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-20 object-cover rounded border transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded border">
          <div className="text-center text-gray-500 text-xs">
            <div className="w-8 h-8 mx-auto mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Failed to load
          </div>
        </div>
      )}
    </div>
  );
};

const UpdateAsset = ({ isOpen, onClose, asset }) => {
  // Process asset data to handle undefined values and date conversions
  const processAssetData = (assetData) => {
    if (!assetData) return {};

    const processed = { ...assetData };

    // Handle undefined values - convert to empty strings or null
    Object.keys(processed).forEach(key => {
      if (processed[key] === 'undefined' || processed[key] === undefined) {
        processed[key] = key.includes('Date') ? null : '';
      }
    });

    // Convert date strings to Date objects
    const dateFields = ['invoiceDate', 'purchaseDate', 'endOfLife', 'capitalizationDate'];
    dateFields.forEach(field => {
      if (processed[field] && typeof processed[field] === 'string' && processed[field] !== '') {
        try {
          processed[field] = new Date(processed[field]);
        } catch (e) {
          processed[field] = null;
        }
      }
    });

    // Handle linkedAsset - convert to string if it's an object
    if (processed.linkedAsset && typeof processed.linkedAsset === 'object') {
      processed.linkedAsset = processed.linkedAsset.id || '';
    }

    // Handle fileCategories - set common category from first item
    if (processed.fileCategories && Array.isArray(processed.fileCategories) && processed.fileCategories.length > 0) {
      processed.commonFileCategory = processed.fileCategories[0];
    } else {
      processed.commonFileCategory = 'general';
    }

    return processed;
  };

  const processedAsset = processAssetData(asset);

  const { register, handleSubmit, control, formState: { errors }, setValue, reset } = useForm({
    defaultValues: processedAsset
  });
  const dispatch = useDispatch();
  const { assets } = useSelector(state => state.assets);

  const [imagePreviews, setImagePreviews] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [commonFileCategory, setCommonFileCategory] = useState(processedAsset.commonFileCategory || 'general');
  const [loadingImages, setLoadingImages] = useState(new Set());

  // Update state when asset changes
  useEffect(() => {
    if (!asset) {
      // Reset to empty state if no asset
      setImagePreviews([]);
      setFilePreviews([]);
      setCommonFileCategory('general');
      setLoadingImages(new Set());
      return;
    }

    const newProcessedAsset = processAssetData(asset);
    setCommonFileCategory(newProcessedAsset.commonFileCategory || 'general');

    // Reset form with new processed data
    reset(newProcessedAsset);

    // Populate image previews from existing asset data
    if (asset?.images && Array.isArray(asset.images)) {
      const imagePreviewsData = asset.images
        .filter(image => image && typeof image === 'object') // Filter out null/undefined images
        .map((image, index) => {
          // Handle different image URL formats with null checks
          let imageUrl = '';

          if (image && image.url) {
            // If backend provides full URL
            imageUrl = image.url;
          } else if (image && image.path) {
            // If path is provided, construct full URL
            imageUrl = image.path.startsWith('http') ? image.path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${image.path}`;
          } else if (image && image.relativePath) {
            // If relative path is provided
            imageUrl = image.relativePath.startsWith('http') ? image.relativePath : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${image.relativePath}`;
          } else {
            // Fallback placeholder for missing images
            imageUrl = `data:image/svg+xml;base64,${btoa(`
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" fill="#f3f4f6"/>
                <path d="M40 25C35.5 25 32 28.5 32 33C32 35.5 33.5 37.5 35.5 38.5L37 39.5V45H43V39.5L44.5 38.5C46.5 37.5 48 35.5 48 33C48 28.5 44.5 25 40 25Z" fill="#6b7280"/>
                <circle cx="40" cy="50" r="2" fill="#6b7280"/>
                <text x="40" y="70" text-anchor="middle" font-family="Arial" font-size="8" fill="#6b7280">No Image</text>
              </svg>
            `)}`;
          }

          return {
            id: `existing-image-${index}`, // Unique ID for each existing image
            file: null, // No actual file object for existing images
            preview: imageUrl, // Use constructed URL as preview
            existing: true, // Mark as existing file
            name: (image && image.name) || `Image ${index + 1}`,
            path: image && image.path,
            relativePath: image && image.relativePath,
            url: image && image.url
          };
        });
      setImagePreviews(imagePreviewsData);

      // Initialize loading state for existing images
      const initialLoading = new Set(imagePreviewsData.map(img => img.id));
      setLoadingImages(initialLoading);
    } else {
      setImagePreviews([]);
    }

    // Populate file previews from existing asset data
    if (asset?.files && Array.isArray(asset.files)) {
      const filePreviewsData = asset.files
        .filter(file => file && typeof file === 'object') // Filter out null/undefined files
        .map((file, index) => ({
          id: `existing-file-${index}`, // Unique ID for each existing file
          file: null, // No actual file object for existing files
          category: newProcessedAsset.commonFileCategory || 'general',
          existing: true, // Mark as existing file
          name: (file && file.path) ? file.path.split('/').pop() : `File ${index + 1}`,
          size: 0, // Size not available for existing files
          type: (file && file.path) ? file.path.split('.').pop() : 'unknown',
          path: file && file.path,
          relativePath: file && file.relativePath
        }));
      setFilePreviews(filePreviewsData);
    } else {
      setFilePreviews([]);
    }
  }, [asset, reset]);

  const onDropImages = (acceptedFiles) => {
    // Replace existing images with new ones, limit to 5
    const newImages = acceptedFiles.slice(0, 5);

    if (newImages.length === 0) {
      console.log('No new images to add');
      return;
    }

    // Create previews for new files
    const newImagePreviews = newImages.map((file, idx) => ({
      id: `new-image-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file),
      existing: false,
      name: file.name
    }));

    // Replace existing previews with new ones
    setImagePreviews(newImagePreviews);

    // Set form value to new files only
    setValue('images', newImages);
  };

  const onDropFiles = (acceptedFiles) => {
    // Replace existing files with new ones, limit to 5
    const newFiles = acceptedFiles.slice(0, 5);

    if (newFiles.length === 0) {
      console.log('No new files to add');
      return;
    }

    // Create previews for new files
    const newFilePreviews = newFiles.map((file, idx) => ({
      id: `new-file-${Date.now()}-${idx}`,
      file,
      category: commonFileCategory,
      existing: false,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    // Replace existing previews with new ones
    setFilePreviews(newFilePreviews);

    // Set form value to new files only
    setValue('files', newFiles);
  };

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
    maxSize: 5 * 1024 * 1024, // 5MB per image
    onDropRejected: (fileRejections) => {
      console.log('Image upload rejected:', fileRejections);
      // You could show a toast notification here
    }
  });

  const { getRootProps: getFilesRootProps, getInputProps: getFilesInputProps } = useDropzone({
    onDrop: onDropFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    onDropRejected: (fileRejections) => {
      console.log('File upload rejected:', fileRejections);
      // You could show a toast notification here
    }
  });

  const onSubmit = (data) => {
    const formData = new FormData();

    // Handle regular form data
    Object.keys(data).forEach(key => {
      if (key !== 'images' && key !== 'files') {
        let value = data[key];
        if (value instanceof Date) {
          value = value.toISOString();
        } else if (typeof value === 'string' && value === '') {
          value = null;
        }
        formData.append(key, value);
      }
    });

    // Handle images - send new images if selected, otherwise indicate to keep existing
    const newImages = imagePreviews.filter(preview => preview && preview.file instanceof File);
    if (newImages.length > 0) {
      // New images selected - replace existing ones
      newImages.forEach((preview, index) => {
        formData.append(`images[${index}]`, preview.file);
      });
      formData.append('replaceImages', 'true');
    } else {
      // No new images selected - keep existing ones
      formData.append('keepExistingImages', 'true');
    }

    // Handle files - send new files if selected, otherwise indicate to keep existing
    const newFiles = filePreviews.filter(preview => preview && preview.file instanceof File);
    if (newFiles.length > 0) {
      // New files selected - replace existing ones
      newFiles.forEach((preview, index) => {
        formData.append(`files[${index}]`, preview.file);
      });
      // Send fileCategories as comma-separated string
      const categoriesString = newFiles.map(preview => preview.category || 'general').join(',');
      formData.append('fileCategories', categoriesString);
      formData.append('replaceFiles', 'true');
    } else {
      // No new files selected - keep existing ones
      formData.append('keepExistingFiles', 'true');
    }

    dispatch(updateAsset({ id: asset.id, asset: formData }));
    dispatch(fetchAssets());
    onClose();

    // Clean up object URLs
    imagePreviews.forEach(preview => {
      if (preview.preview && preview.preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview.preview);
      }
    });

    setImagePreviews([]);
    setFilePreviews([]);
    setLoadingImages(new Set());
    setCommonFileCategory('general');
  };

  const handleClose = () => {
    reset();
    setCommonFileCategory('general');
    setImagePreviews([]);
    setFilePreviews([]);
    setLoadingImages(new Set());
    onClose();
  };

  const categoryOptions = [
    { value: 'machinery', label: 'Machinery' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'vehicles', label: 'Vehicles' }
  ];

  const statusOptions = [
    { value: 'in_use', label: 'In Use' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'out_for_repair', label: 'Out for Repair' }
  ];

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'good', label: 'Good' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'poor', label: 'Poor' }
  ];

  const ownershipOptions = [
    { value: 'self_owned', label: 'Self-Owned' },
    { value: 'partner', label: 'Partner' }
  ];

  const fileCategoryOptions = [
    { value: 'insurance', label: 'Insurance' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'manual', label: 'Manual' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'general', label: 'General' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Update Asset">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        {/* Basic Information */}
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <Input
          label="Asset Name"
          {...register('name', { required: 'Asset Name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

        <Input
          label="Asset Code"
          {...register('code', { required: 'Asset Code is required' })}
        />
        {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}

        <Controller
          name="category"
          control={control}
          rules={{ required: 'Category is required' }}
          render={({ field }) => (
            <Input
              label="Category"
              type="select"
              options={categoryOptions}
              value={categoryOptions.find(opt => opt.value === field.value)}
              onChange={(selected) => field.onChange(selected?.value)}
            />
          )}
        />
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}

        <Input
          label="CWIP Invoice ID"
          {...register('cwipInvoiceId', { maxLength: { value: 50, message: 'Max 50 characters' } })}
        />

        <Input
          label="Location"
          {...register('location', { required: 'Location is required' })}
        />
        {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}

        <Controller
          name="status"
          control={control}
          rules={{ required: 'Status is required' }}
          render={({ field }) => (
            <Input
              label="Status"
              type="select"
              options={statusOptions}
              value={statusOptions.find(opt => opt.value === field.value)}
              onChange={(selected) => field.onChange(selected?.value)}
            />
          )}
        />
        {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}

        <Controller
          name="condition"
          control={control}
          rules={{ required: 'Condition is required' }}
          render={({ field }) => (
            <Input
              label="Condition"
              type="select"
              options={conditionOptions}
              value={conditionOptions.find(opt => opt.value === field.value)}
              onChange={(selected) => field.onChange(selected?.value)}
            />
          )}
        />
        {errors.condition && <p className="text-red-500 text-sm">{errors.condition.message}</p>}

        <Input
          label="Brand"
          {...register('brand', { maxLength: { value: 50, message: 'Max 50 characters' } })}
        />

        <Input
          label="Model"
          {...register('model', { maxLength: { value: 50, message: 'Max 50 characters' } })}
        />

        <Controller
          name="linkedAsset"
          control={control}
          render={({ field }) => (
            <Input
              label="Linked Asset"
              type="select"
              options={assets.map(a => ({ value: a.id, label: a.name }))}
              value={assets.find(a => a.id === field.value) ? { value: field.value, label: assets.find(a => a.id === field.value).name } : null}
              onChange={(selected) => field.onChange(selected?.value)}
            />
          )}
        />

        <Input
          label="Description"
          type="textarea"
          {...register('description', { maxLength: { value: 5000, message: 'Max 5000 characters' } })}
        />

        {/* File Uploads */}
        <h3 className="text-lg font-semibold mb-4 mt-6">Update Asset Images</h3>
        <div {...getImagesRootProps()} className="border-2 border-dashed border-gray-300 p-4 mb-4 cursor-pointer">
          <input {...getImagesInputProps()} />
          <p className="text-gray-600">Drag 'n' drop images here, or click to select multiple (JPG, JPEG, PNG, GIF, WebP, max 5MB each). Selecting new images will replace existing ones.</p>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Image Previews:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {imagePreviews
                .filter(preview => preview && preview.preview) // Filter out null/undefined previews
                .map((preview, index) => (
                  <div key={preview.id || index} className="relative">
                    <LazyImage
                      src={preview.preview}
                      alt={`Preview ${index + 1}`}
                      className="rounded border"
                      onLoad={() => {
                        setLoadingImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(preview.id);
                          return newSet;
                        });
                      }}
                      onError={(e) => {
                        setLoadingImages(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(preview.id);
                          return newSet;
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPreviews = imagePreviews.filter(p => p.id !== preview.id);
                        setImagePreviews(newPreviews);
                        setValue('images', newPreviews.map(p => p && p.file).filter(f => f));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-4">Update Files</h3>

        {/* Common File Category Selection */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">File Category (applies to all files)</label>
          <select
            value={commonFileCategory}
            onChange={(e) => {
              setCommonFileCategory(e.target.value);
              // Update existing file previews with new category
              setFilePreviews(prev => prev.map(preview => ({
                ...preview,
                category: e.target.value
              })));
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {fileCategoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div {...getFilesRootProps()} className="border-2 border-dashed border-gray-300 p-4 mb-4 cursor-pointer">
          <input {...getFilesInputProps()} />
          <p className="text-gray-600">Drag 'n' drop files here, or click to select multiple (PDF, DOCX, DOC, max 10MB each). Selecting new files will replace existing ones.</p>
        </div>

        {/* File Previews with Common Category */}
        {filePreviews.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">File Previews (Category: {fileCategoryOptions.find(opt => opt.value === commonFileCategory)?.label}):</h4>
            <div className="space-y-2">
              {filePreviews
                .filter(preview => preview) // Filter out null/undefined previews
                .map((preview, index) => (
                  <div key={preview.id || index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{preview.name || 'Unknown file'}</p>
                      <p className="text-xs text-gray-500">
                        {preview.existing ? 'Existing file' : `${preview.size ? (preview.size / 1024 / 1024).toFixed(2) : 0} MB • ${preview.type || 'unknown'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newPreviews = filePreviews.filter(p => p.id !== preview.id);
                          setFilePreviews(newPreviews);
                          setValue('files', newPreviews.map(p => p && p.file).filter(f => f));
                        }}
                        className="bg-red-500 text-white rounded px-2 py-1 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Purchase Information */}
        <h3 className="text-lg font-semibold mb-4 mt-6">Purchase Information</h3>
        <Input
          label="Vendor Name"
          {...register('vendorName')}
        />

        <Input
          label="PO Number"
          {...register('poNumber', { maxLength: { value: 20, message: 'Max 20 characters' } })}
        />

        <Controller
          name="invoiceDate"
          control={control}
          render={({ field }) => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Invoice Date</label>
              <DatePicker
                selected={field.value ? new Date(field.value) : null}
                onChange={field.onChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          )}
        />

        <Input
          label="Invoice No"
          {...register('invoiceNo')}
        />

        <Controller
          name="purchaseDate"
          control={control}
          render={({ field }) => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Purchase Date</label>
              <DatePicker
                selected={field.value ? new Date(field.value) : null}
                onChange={field.onChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          )}
        />

        <Input
          label="Purchase Price"
          type="number"
          step="0.01"
          {...register('purchasePrice', { min: { value: 0, message: 'Must be positive' } })}
        />

        <Controller
          name="ownership"
          control={control}
          rules={{ required: 'Ownership is required' }}
          render={({ field }) => (
            <Input
              label="Self-Owned / Partner"
              type="select"
              options={ownershipOptions}
              value={ownershipOptions.find(opt => opt.value === field.value)}
              onChange={(selected) => field.onChange(selected?.value)}
            />
          )}
        />
        {errors.ownership && <p className="text-red-500 text-sm">{errors.ownership.message}</p>}

        {/* Financial Information */}
        <h3 className="text-lg font-semibold mb-4 mt-6">Financial Information</h3>
        <Input
          label="Capitalization Price"
          type="number"
          step="0.01"
          {...register('capitalizationPrice', { min: { value: 0, message: 'Must be positive' } })}
        />

        <Controller
          name="endOfLife"
          control={control}
          render={({ field }) => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">End of Life</label>
              <DatePicker
                selected={field.value ? new Date(field.value) : null}
                onChange={field.onChange}
                minDate={new Date()}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          )}
        />

        <Controller
          name="capitalizationDate"
          control={control}
          rules={{ required: 'Capitalization Date is required' }}
          render={({ field }) => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Capitalization Date</label>
              <DatePicker
                selected={field.value ? new Date(field.value) : null}
                onChange={field.onChange}
                maxDate={new Date()}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          )}
        />
        {errors.capitalizationDate && <p className="text-red-500 text-sm">{errors.capitalizationDate.message}</p>}

        <Input
          label="Depreciation %"
          type="number"
          step="0.01"
          {...register('depreciationPercent', { min: { value: 0, message: 'Must be positive' }, max: { value: 100, message: 'Max 100%' } })}
        />

        <Input
          label="Accumulated Depreciation"
          type="number"
          step="0.01"
          {...register('accumulatedDepreciation', { min: { value: 0, message: 'Must be positive' } })}
        />

        <Input
          label="Scrap Value"
          type="number"
          step="0.01"
          {...register('scrapValue', { min: { value: 0, message: 'Must be positive' } })}
        />

        <Input
          label="Income Tax Depreciation %"
          type="number"
          step="0.01"
          {...register('incomeTaxDepreciationPercent', { min: { value: 0, message: 'Must be positive' }, max: { value: 100, message: 'Max 100%' } })}
        />

        <div className="flex justify-end mt-6">
          <Button type="submit" className="mr-2">Update Asset</Button>
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateAsset;
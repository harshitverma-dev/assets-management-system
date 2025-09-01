import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { addAsset, fetchAssets } from '../store/assetsSlice';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useState, useRef, useEffect } from 'react';

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

const AddAsset = ({ isOpen, onClose }) => {
  const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm();
  const dispatch = useDispatch();
  const { assets } = useSelector(state => state.assets);

  const [imagePreviews, setImagePreviews] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [commonFileCategory, setCommonFileCategory] = useState('general');

  const onDropImages = (acceptedFiles) => {
    // Append new files to existing ones, but limit total to 5
    const currentFiles = imagePreviews.map(p => p.file);
    const newFiles = [...currentFiles, ...acceptedFiles].slice(0, 5);
    setValue('images', newFiles);

    // Create image previews for all files
    const previews = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImagePreviews(previews);
  };

  const onDropFiles = (acceptedFiles) => {
    // Append new files to existing ones, but limit total to 5
    const currentFiles = filePreviews.map(p => p.file);
    const newFiles = [...currentFiles, ...acceptedFiles].slice(0, 5);
    setValue('files', newFiles);

    // Create file previews for all files with common category
    const previews = newFiles.map(file => ({
      file,
      category: commonFileCategory,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setFilePreviews(previews);
  };

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
    onDrop: onDropImages,
    accept: 'image/*',
    multiple: true
  });

  const { getRootProps: getFilesRootProps, getInputProps: getFilesInputProps } = useDropzone({
    onDrop: onDropFiles,
    accept: '.pdf,.docx',
    multiple: true
  });

  const generateAssetCode = () => {
    const code = 'AST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setValue('code', code);
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key].forEach((file, index) => {
          formData.append(`${key}[${index}]`, file);
        });
      } else {
        formData.append(key, data[key]);
      }
    });

    // Send fileCategories as comma-separated string
    const categoriesString = filePreviews.map(preview => preview.category).join(',');
    formData.append('fileCategories', categoriesString);

    dispatch(addAsset(formData));
    dispatch(fetchAssets());
    onClose();
    reset();

    imagePreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
    setImagePreviews([]);
    setFilePreviews([]);
    setCommonFileCategory('general');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Asset">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        {/* Basic Information */}
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <Input
          label="Asset Name"
          {...register('name', { required: 'Asset Name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="Asset Code"
              {...register('code', { required: 'Asset Code is required' })}
            />
          </div>
          <Button type="button" onClick={generateAssetCode} className="mt-6">Generate</Button>
        </div>
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
              options={assets.map(asset => ({ value: asset.id, label: asset.name }))}
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
        <h3 className="text-lg font-semibold mb-4 mt-6">Asset Images</h3>
        <div {...getImagesRootProps()} className="border-2 border-dashed border-gray-300 p-4 mb-4 cursor-pointer">
          <input {...getImagesInputProps()} />
          <p className="text-gray-600">Drag 'n' drop images here, or click to select multiple (JPG, JPEG, PNG, max 5MB each). You can select files multiple times to add up to 5 total.</p>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Image Previews:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <LazyImage
                    src={preview.preview}
                    alt={`Preview ${index + 1}`}
                    className="rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newPreviews = imagePreviews.filter((_, i) => i !== index);
                      setImagePreviews(newPreviews);
                      setValue('images', newPreviews.map(p => p.file));
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

        <h3 className="text-lg font-semibold mb-4">Upload Files</h3>

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
          <p className="text-gray-600">Drag 'n' drop files here, or click to select multiple (PDF, DOCX, max 10MB each). You can select files multiple times to add up to 5 total.</p>
        </div>

        {/* File Previews with Common Category */}
        {filePreviews.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">File Previews (Category: {fileCategoryOptions.find(opt => opt.value === commonFileCategory)?.label}):</h4>
            <div className="space-y-2">
              {filePreviews.map((preview, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{preview.name}</p>
                    <p className="text-xs text-gray-500">
                      {(preview.size / 1024 / 1024).toFixed(2)} MB • {preview.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newPreviews = filePreviews.filter((_, i) => i !== index);
                        setFilePreviews(newPreviews);
                        setValue('files', newPreviews.map(p => p.file));
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
                selected={field.value}
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
                selected={field.value}
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
                selected={field.value}
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
                selected={field.value}
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
          <Button type="submit" className="mr-2">Add Asset</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAsset;
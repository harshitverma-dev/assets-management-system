import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssets, deleteAsset } from '../store/assetsSlice';
import Button from './Button';
import Input from './Input';
import ConfirmModal from './ConfirmModal';

const ListAssets = ({ onAdd, onEdit }) => {
  const dispatch = useDispatch();
  const { assets, loading } = useSelector(state => state.assets);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, assetId: null, assetName: '' });
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchAssets());
  }, [dispatch]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            asset.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || asset.category === categoryFilter;
      const matchesStatus = !statusFilter || asset.status === statusFilter;

      // Debug logging for status filter
      if (statusFilter && asset.status !== statusFilter) {
        console.log('Status filter debug:', {
          filter: statusFilter,
          assetStatus: asset.status,
          matches: matchesStatus
        });
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (asset) => {
    setConfirmModal({
      isOpen: true,
      assetId: asset.id,
      assetName: asset.name
    });
  };

  const confirmDelete = () => {
    dispatch(deleteAsset(confirmModal.assetId));
    setConfirmModal({ isOpen: false, assetId: null, assetName: '' });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, assetId: null, assetName: '' });
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'machinery', label: 'Machinery' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'vehicles', label: 'Vehicles' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'in_use', label: 'In Use' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'out_for_repair', label: 'Out for Repair' }
  ];

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getCategoryLabel = (category) => {
    const categoryOption = categoryOptions.find(option => option.value === category);
    return categoryOption ? categoryOption.label : category;
  };

  const getConditionLabel = (condition) => {
    const conditionOptions = [
      { value: 'new', label: 'New' },
      { value: 'good', label: 'Good' },
      { value: 'damaged', label: 'Damaged' },
      { value: 'poor', label: 'Poor' }
    ];
    const conditionOption = conditionOptions.find(option => option.value === condition);
    return conditionOption ? conditionOption.label : condition;
  };

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Button onClick={onAdd}>Add Asset</Button>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or code..."
        />
        <Input
          label="Category"
          type="select"
          options={categoryOptions}
          value={categoryOptions.find(opt => opt.value === categoryFilter)}
          onChange={(selected) => setCategoryFilter(selected?.value || '')}
        />
        <Input
          label="Status"
          type="select"
          options={statusOptions}
          value={statusOptions.find(opt => opt.value === statusFilter)}
          onChange={(selected) => setStatusFilter(selected?.value || '')}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-center">Asset Name</th>
              <th className="py-2 px-4 border-b text-center">Code</th>
              <th className="py-2 px-4 border-b text-center">Category</th>
              <th className="py-2 px-4 border-b text-center">Location</th>
              <th className="py-2 px-4 border-b text-center">Status</th>
              <th className="py-2 px-4 border-b text-center">Condition</th>
              <th className="py-2 px-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b text-center">{asset.name}</td>
                <td className="py-2 px-4 border-b text-center">{asset.code}</td>
                <td className="py-2 px-4 border-b text-center">{getCategoryLabel(asset.category)}</td>
                <td className="py-2 px-4 border-b text-center">{asset.location}</td>
                <td className="py-2 px-4 border-b text-center">{getStatusLabel(asset.status)}</td>
                <td className="py-2 px-4 border-b text-center">{getConditionLabel(asset.condition)}</td>
                <td className="py-2 px-4 border-b text-center">
                  <Button onClick={() => onEdit(asset)} className="mr-2">Edit</Button>
                  <Button onClick={() => handleDelete(asset)} variant="danger">Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="mr-2"
          >
            Previous
          </Button>
          <span className="self-center">Page {currentPage} of {totalPages}</span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="ml-2"
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete "${confirmModal.assetName}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ListAssets;
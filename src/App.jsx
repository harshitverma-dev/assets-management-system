import { useState } from 'react';
import ListAssets from './components/ListAssets';
import AddAsset from './components/AddAsset';
import UpdateAsset from './components/UpdateAsset';
import { ToastContainer } from 'react-toastify';


function App() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const handleAdd = () => setAddModalOpen(true);
  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setEditModalOpen(true);
  };
  const handleCloseAdd = () => setAddModalOpen(false);
  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingAsset(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ListAssets onAdd={handleAdd} onEdit={handleEdit} />
      <AddAsset isOpen={addModalOpen} onClose={handleCloseAdd} />
      <UpdateAsset isOpen={editModalOpen} onClose={handleCloseEdit} asset={editingAsset} />
      <ToastContainer />
    </div>
  );
}

export default App;

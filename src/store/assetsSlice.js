import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import api from '../services/api';

// Async thunks for API calls
export const fetchAssets = createAsyncThunk('assets/fetchAssets', async () => {
  const response = await api.get('/assets');
  return response.data;
});

export const addAsset = createAsyncThunk('assets/addAsset', async (asset) => {
  const response = await api.post('/assets', asset);
  return response.data;
});

export const updateAsset = createAsyncThunk('assets/updateAsset', async ({ id, asset }) => {
  const response = await api.put(`/assets/${id}`, asset);
  return response.data;
});

export const deleteAsset = createAsyncThunk('assets/deleteAsset', async (id) => {
  await api.delete(`/assets/${id}`);
  return id;
});

const assetsSlice = createSlice({
  name: 'assets',
  initialState: {
    assets: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload;
        toast.success('Assets loaded successfully');
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        toast.error('Failed to load assets: ' + action.error.message);
      })
      .addCase(addAsset.fulfilled, (state, action) => {
        state.assets.push(action.payload);
        toast.success('Asset added successfully');
      })
      .addCase(addAsset.rejected, (state, action) => {
        toast.error('Failed to add asset: ' + action.error.message);
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.assets.findIndex(asset => asset.id === action.payload.id);
        if (index !== -1) {
          state.assets[index] = action.payload;
        }
        toast.success('Asset updated successfully');
      })
      .addCase(updateAsset.rejected, (state, action) => {
        toast.error('Failed to update asset: ' + action.error.message);
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.assets = state.assets.filter(asset => asset.id !== action.payload);
        toast.success('Asset deleted successfully');
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        toast.error('Failed to delete asset: ' + action.error.message);
      });
  },
});

export default assetsSlice.reducer;
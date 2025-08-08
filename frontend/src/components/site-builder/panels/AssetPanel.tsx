/**
 * StackPro Site Builder - Asset Panel
 * Manages images, files, and other media assets
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, File, Trash2, Search, FolderPlus } from 'lucide-react';

export interface AssetPanelProps {
  clientId: string;
  onAssetSelect: (asset: Asset) => void;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  size: number;
  uploadedAt: string;
  folder?: string;
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string;
  assetCount: number;
}

export const AssetPanel: React.FC<AssetPanelProps> = ({ clientId, onAssetSelect }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([
    { id: 'images', name: 'Images', assetCount: 0 },
    { id: 'documents', name: 'Documents', assetCount: 0 },
    { id: 'logos', name: 'Logos', assetCount: 0 }
  ]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock assets for demo
  React.useEffect(() => {
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'hero-image.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
        size: 245760,
        uploadedAt: '2024-01-15T10:30:00Z',
        folder: 'images'
      },
      {
        id: '2',
        name: 'company-logo.png',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80',
        size: 51200,
        uploadedAt: '2024-01-14T15:20:00Z',
        folder: 'logos'
      },
      {
        id: '3',
        name: 'team-photo.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
        size: 180000,
        uploadedAt: '2024-01-13T09:45:00Z',
        folder: 'images'
      },
      {
        id: '4',
        name: 'services-brochure.pdf',
        type: 'document',
        url: '/assets/brochure.pdf',
        size: 1024000,
        uploadedAt: '2024-01-12T14:10:00Z',
        folder: 'documents'
      }
    ];
    setAssets(mockAssets);
  }, []);

  // Filter assets based on selected folder and search
  const filteredAssets = assets.filter(asset => {
    const matchesFolder = !selectedFolder || asset.folder === selectedFolder;
    const matchesSearch = !searchQuery || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);
        formData.append('folder', selectedFolder || 'general');
        
        // Upload to backend
        const response = await fetch('/api/site-builder/assets/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          const newAsset: Asset = {
            id: result.id,
            name: file.name,
            type: getFileType(file.type),
            url: result.url,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            folder: selectedFolder || undefined
          };
          
          setAssets(prev => [...prev, newAsset]);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [clientId, selectedFolder]);

  // Get file type from MIME type
  const getFileType = (mimeType: string): Asset['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle asset selection
  const handleAssetClick = (asset: Asset) => {
    if (selectedAssets.includes(asset.id)) {
      setSelectedAssets(prev => prev.filter(id => id !== asset.id));
    } else {
      setSelectedAssets([asset.id]); // Single selection for now
      onAssetSelect(asset);
    }
  };

  // Delete selected assets
  const handleDeleteAssets = async () => {
    if (selectedAssets.length === 0) return;
    
    try {
      for (const assetId of selectedAssets) {
        await fetch(`/api/site-builder/assets/${assetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      setAssets(prev => prev.filter(asset => !selectedAssets.includes(asset.id)));
      setSelectedAssets([]);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Create new folder
  const createFolder = () => {
    const name = prompt('Enter folder name:');
    if (name) {
      const newFolder: AssetFolder = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        assetCount: 0
      };
      setFolders(prev => [...prev, newFolder]);
    }
  };

  return (
    <div className="asset-panel h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Asset Library</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={createFolder}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg"
              title="Create folder"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Folders */}
        <div className="space-y-1">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedFolder === null 
                ? 'bg-blue-100 text-blue-900' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Assets ({assets.length})
          </button>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedFolder === folder.id 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {folder.name} ({assets.filter(a => a.folder === folder.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Choose Files
          </button>
        </div>

        {/* Selected Assets Actions */}
        {selectedAssets.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-900">
              {selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleDeleteAssets}
              className="flex items-center px-3 py-1 text-red-600 hover:text-red-800 text-sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        )}

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No assets found</p>
            <p className="text-sm text-gray-400">
              Upload some files to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                  selectedAssets.includes(asset.id)
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Asset Thumbnail */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {asset.type === 'image' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <File className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                {/* Asset Info */}
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 truncate mb-1">
                    {asset.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(asset.size)}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedAssets.includes(asset.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-900">Uploading files...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx"
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

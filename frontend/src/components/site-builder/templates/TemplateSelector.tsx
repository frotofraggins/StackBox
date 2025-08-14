/**
 * StackPro Site Builder - Template Selector
 * Allows users to choose from industry-specific templates
 */

import React, { useState } from 'react';
import { Search, Star, Eye, ArrowRight, X } from 'lucide-react';

export interface TemplateSelectorProps {
  clientId: string;
  onSelect: (templateId: string) => void;
  onSkip: () => void;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  features: string[];
  popular: boolean;
  industry: string[];
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  clientId, 
  onSelect, 
  onSkip 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Sample templates for different industries
  const templates: Template[] = [
    {
      id: 'law-firm-professional',
      name: 'Professional Law Firm',
      category: 'legal',
      description: 'Clean, professional template perfect for law firms and legal services',
      preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
      features: ['Contact Forms', 'Service Pages', 'Attorney Profiles', 'Testimonials'],
      popular: true,
      industry: ['legal', 'professional']
    },
    {
      id: 'real-estate-modern',
      name: 'Modern Real Estate',
      category: 'real-estate',
      description: 'Showcase properties with style and attract more clients',
      preview: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      features: ['Property Listings', 'Virtual Tours', 'Agent Profiles', 'Market Data'],
      popular: true,
      industry: ['real-estate', 'sales']
    },
    {
      id: 'healthcare-clinic',
      name: 'Medical Clinic',
      category: 'healthcare',
      description: 'Professional healthcare template with appointment booking',
      preview: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
      features: ['Appointment Booking', 'Service Directory', 'Staff Profiles', 'Patient Portal'],
      popular: false,
      industry: ['healthcare', 'medical']
    },
    {
      id: 'coaching-business',
      name: 'Business Coach',
      category: 'coaching',
      description: 'Inspire and convert visitors with a powerful coaching presence',
      preview: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
      features: ['Program Showcase', 'Success Stories', 'Booking System', 'Resource Library'],
      popular: false,
      industry: ['coaching', 'consulting']
    },
    {
      id: 'restaurant-elegant',
      name: 'Elegant Restaurant',
      category: 'restaurant',
      description: 'Sophisticated dining experience with online reservations',
      preview: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      features: ['Menu Display', 'Reservation System', 'Photo Gallery', 'Event Booking'],
      popular: false,
      industry: ['restaurant', 'hospitality']
    },
    {
      id: 'creative-agency',
      name: 'Creative Agency',
      category: 'creative',
      description: 'Bold and creative template for agencies and designers',
      preview: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
      features: ['Portfolio Gallery', 'Project Showcase', 'Team Profiles', 'Creative Blog'],
      popular: true,
      industry: ['creative', 'design', 'marketing']
    },
    {
      id: 'financial-advisor',
      name: 'Financial Services',
      category: 'finance',
      description: 'Trustworthy template for financial advisors and planners',
      preview: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
      features: ['Service Calculator', 'Client Portal', 'Market Updates', 'Consultation Booking'],
      popular: false,
      industry: ['finance', 'consulting']
    },
    {
      id: 'general-business',
      name: 'General Business',
      category: 'business',
      description: 'Versatile template suitable for any professional service',
      preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      features: ['About Section', 'Services Grid', 'Contact Forms', 'Testimonials'],
      popular: false,
      industry: ['business', 'professional', 'service']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'legal', name: 'Legal', count: templates.filter(t => t.category === 'legal').length },
    { id: 'real-estate', name: 'Real Estate', count: templates.filter(t => t.category === 'real-estate').length },
    { id: 'healthcare', name: 'Healthcare', count: templates.filter(t => t.category === 'healthcare').length },
    { id: 'coaching', name: 'Coaching', count: templates.filter(t => t.category === 'coaching').length },
    { id: 'restaurant', name: 'Restaurant', count: templates.filter(t => t.category === 'restaurant').length },
    { id: 'creative', name: 'Creative', count: templates.filter(t => t.category === 'creative').length },
    { id: 'finance', name: 'Finance', count: templates.filter(t => t.category === 'finance').length },
    { id: 'business', name: 'Business', count: templates.filter(t => t.category === 'business').length }
  ];

  // Filter templates based on category and search
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.industry.some(industry => industry.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort templates - popular first, then alphabetically
  const sortedTemplates = filteredTemplates.sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleTemplateSelect = (template: Template) => {
    onSelect(template.id);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  return (
    <div className="template-selector min-h-screen bg-surface-2">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Choose Your Template</h1>
              <p className="text-sm text-gray-500">Select a template that fits your business</p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-muted text-sm font-medium"
            >
              Skip & Start Blank
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-secondary"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'text-muted hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-500">{category.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1">
            {sortedTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Template Preview Image */}
                    <div className="relative aspect-video bg-surface-2">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Popular Badge */}
                      {template.popular && (
                        <div className="absolute top-3 left-3 flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </div>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handlePreview(template)}
                            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-surface-2 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-2 inline" />
                            Preview
                          </button>
                          <button
                            onClick={() => handleTemplateSelect(template)}
                            className="px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Select
                            <ArrowRight className="h-4 w-4 ml-2 inline" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      </div>
                      
                      <p className="text-sm text-muted mb-4">{template.description}</p>
                      
                      {/* Features */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {template.features.slice(0, 3).map((feature, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-surface-2 text-muted text-xs rounded"
                            >
                              {feature}
                            </span>
                          ))}
                          {template.features.length > 3 && (
                            <span className="inline-block px-2 py-1 text-gray-500 text-xs">
                              +{template.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(template)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-muted rounded-lg hover:bg-surface-2 transition-colors text-sm font-medium"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleTemplateSelect(template)}
                          className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewTemplate.name}</h3>
                <p className="text-sm text-muted">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-gray-400 hover:text-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="aspect-video bg-surface-2 rounded-lg mb-6 overflow-hidden">
                <img
                  src={previewTemplate.preview}
                  alt={previewTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Features List */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Included Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {previewTemplate.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-muted">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-6 py-2 border border-gray-300 text-muted rounded-lg hover:bg-surface-2 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleTemplateSelect(previewTemplate)}
                  className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  Select This Template
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

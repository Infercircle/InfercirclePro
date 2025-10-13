'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  used_by?: string;
  used_at?: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface Filters {
  status: 'all' | 'used' | 'unused';
  search: string;
}

export default function InviteCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<InviteCode[]>([]);
  const [newCodeData, setNewCodeData] = useState({ email: '', username: '' });
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const authorizedEmails = ['infercircle@gmail.com', 'kesharwanis084@gmail.com', 'ifechukwuobiezuedoc@gmail.com'];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }
    
    // Check if user is authorized
    if (!session.user?.email || !authorizedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/');
      return;
    }
    
    fetchInviteCodes();
  }, [session, status, router]);

  const fetchInviteCodes = async () => {
    try {
      const response = await fetch('/api/invite-code/generate', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setInviteCodes(data.inviteCodes || []);
      }
    } catch (error) {
      console.error('Error fetching invite codes:', error);
    }
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...inviteCodes];
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(code => 
        filters.status === 'used' ? code.used_by : !code.used_by
      );
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(code =>
        code.code.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredCodes(filtered);
    setCurrentPage(1);
  }, [inviteCodes, filters]);

  const clearFilters = () => {
    setFilters({
      status: 'all',
      search: ''
    });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.search;

  // Pagination
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + itemsPerPage);

  const generateInviteCode = async () => {
    setLoading(true);
    setAlert(null);
    
    try {
      const response = await fetch('/api/invite-code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCodeData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAlert({ message: 'Invite code generated successfully!', type: 'success' });
        setNewCodeData({ email: '', username: '' });
        fetchInviteCodes();
      } else {
        setAlert({ message: data.error || 'Failed to generate invite code', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'An error occurred while generating the invite code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    );
  }

  if (!session?.user?.email || !authorizedEmails.includes(session.user.email.toLowerCase())) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Unauthorized access</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Invite Code Generator</h1>
          <p className="text-gray-400">Generate invite codes for 3-day access</p>
        </div>

        {/* Generate New Invite Code */}
        <div className="bg-[#181c20] border border-[#23272b] rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Generate New Invite Code</h3>
            <p className="text-gray-400 text-sm">Create a new invite code (optional email and username for tracking)</p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newCodeData.email}
                  onChange={(e) => setNewCodeData({ ...newCodeData, email: e.target.value })}
                  className="w-full bg-[#23272b] border border-[#2d3338] text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Username (Optional)</label>
                <input
                  placeholder="Twitter username"
                  value={newCodeData.username}
                  onChange={(e) => setNewCodeData({ ...newCodeData, username: e.target.value })}
                  className="w-full bg-[#23272b] border border-[#2d3338] text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {alert && (
              <div className={`p-3 rounded-lg ${alert.type === 'error' ? 'bg-red-500/10 border border-red-500' : 'bg-green-500/10 border border-green-500'}`}>
                <p className={alert.type === 'error' ? 'text-red-400' : 'text-green-400'}>
                  {alert.message}
                </p>
              </div>
            )}
            
            <button
              onClick={generateInviteCode}
              disabled={loading}
              className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Invite Code'}
            </button>
          </div>
        </div>

        {/* Existing Invite Codes */}
        <div className="bg-[#181c20] border border-[#23272b] rounded-xl p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Generated Invite Codes</h3>
                <p className="text-gray-400 text-sm">
                  {filteredCodes.length} of {inviteCodes.length} invite codes
                  {hasActiveFilters && ' (filtered)'}
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Filters
              </button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  placeholder="Search invite codes..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full bg-[#23272b] border border-[#2d3338] text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="p-4 bg-[#23272b] rounded-lg border border-[#2d3338] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Filters</h4>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white text-sm">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value as 'all' | 'used' | 'unused' })}
                      className="w-full bg-[#2d3338] border border-[#3d4148] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all" className="bg-[#2d3338] text-white">All</option>
                      <option value="unused" className="bg-[#2d3338] text-white">Available</option>
                      <option value="used" className="bg-[#2d3338] text-white">Used</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {filteredCodes.length === 0 ? (
              <div className="text-center py-8">
                {inviteCodes.length === 0 ? (
                  <p className="text-gray-400">No invite codes generated yet</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400">No invite codes match your filters</p>
                    <button
                      onClick={clearFilters}
                      className="text-purple-400 hover:text-white text-sm"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-[#2d3338] rounded-lg text-sm font-medium text-gray-300">
                  <div className="col-span-3">Invite Code</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-2">Expires</div>
                  <div className="col-span-2">Used By</div>
                  <div className="col-span-1">Action</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {paginatedCodes.map((code) => (
                    <div
                      key={code.id}
                      className="grid grid-cols-12 gap-4 p-3 bg-[#23272b] rounded-lg border border-[#2d3338] hover:border-[#3d4148] transition-colors"
                    >
                      <div className="col-span-3 flex items-center">
                        <code className="text-purple-400 font-mono text-sm bg-[#2d3338] px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          code.used_by 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {code.used_by ? 'Used' : 'Available'}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className="text-white text-sm">
                          {new Date(code.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className="text-white text-sm">
                          {new Date(code.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className="text-white text-sm">
                          {code.used_by ? 'User ID: ' + code.used_by.substring(0, 8) + '...' : '-'}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          {copiedCode === code.code ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCodes.length)} of {filteredCodes.length} results
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="text-gray-400 hover:text-white disabled:opacity-50 text-sm"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, arr) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && arr[index - 1] !== page - 1 && (
                                <span className="text-gray-400 px-1">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded text-sm ${
                                  currentPage === page 
                                    ? "bg-purple-600 text-white" 
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          ))
                        }
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="text-gray-400 hover:text-white disabled:opacity-50 text-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

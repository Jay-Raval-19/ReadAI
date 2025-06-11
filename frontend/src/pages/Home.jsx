import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pageRange, setPageRange] = useState({ start: 1, end: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  const autoResize = () => {
    const textArea = textareaRef.current;
    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight - 20}px`;
    if (textArea.scrollHeight > 120) {
      textArea.classList.add('exceeds-max-height');
    } else {
      textArea.classList.remove('exceeds-max-height');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      autoResize();
    }
  }, []);

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.pdf')) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const previewUrl = URL.createObjectURL(file);
      setPdfPreview(previewUrl);

      try {
        const pageCountResponse = await axios.post('https://readai.onrender.com/get-page-count', formData);
        const totalPages = pageCountResponse.data.totalPages;
        setTotalPages(totalPages);
        setPageRange({ start: 1, end: totalPages });

        const uploadResponse = await axios.post('https://readai.onrender.com/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: {
            startPage: pageRange.start,
            endPage: pageRange.end,
          },
        });

        alert('PDF uploaded successfully!');
        console.log('Upload response:', uploadResponse.data);
      } catch (error) {
        console.error('Error uploading PDF:', error);
        const message = error.response?.data?.message || 'Error uploading PDF file.';
        alert(message);
      } finally {
        setIsUploading(false);
      }
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handlePageRangeChange = (type, value) => {
    const numValue = parseInt(value);
    if (type === 'start') {
      setPageRange((prev) => ({
        ...prev,
        start: Math.min(Math.max(1, numValue), prev.end),
      }));
    } else {
      setPageRange((prev) => ({
        ...prev,
        end: Math.max(Math.min(totalPages, numValue), prev.start),
      }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a query.');
      return;
    }

    setIsLoading(true);
    setSearchResults([]); // clear previous results

    try {
      const response = await axios.post('https://readai.onrender.com/search', { query: searchQuery });
      const results = response.data.results || [];
      setSearchResults(results);

      if (results.length === 0) {
        alert('No matching results found. Try different keywords.');
      }
    } catch (error) {
      console.error('Error searching:', error);
      const message = error.response?.data?.message || 'Error processing search query.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className='HomeDiv'>
      <div className='temp' />
      <div className="homepage">
        <div className="tittxt">
          <h1 className="responsive-title"
          style={{
                background: 'linear-gradient(to right, #2c29ff, #2d28ff 8.1%, #2e26ff 15.5%, #3123ff 22.5%, #351fff 29%, #3a1aff 35.3%, #4115ff 41.2%, #4710ff 47.1%, #4f0aff 52.9%, #5705ff 58.8%, #5f00ff 64.7%, #6800fa 71%, #6e00f6 77.5%, #7400f3 84.5%, #7700f1 91.9%, #7800f0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: 'xxx-large',
                fontWeight: 'bold',
                margin: '0px 0px 5px 0px',
              }}
          >
            Turn PDFs into Answers: Start Here
          </h1>
          <p>Upload your PDF and ask a question to get instant answers!</p>
        </div>

        <div className="maincontent">
          <div className="upload">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="pdf-upload"
              disabled={isUploading}
            />
            <div
              className="uploadbtn"
              onClick={() => !isUploading && document.getElementById('pdf-upload').click()}
              style={{ opacity: isUploading ? 0.5 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
            >
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </div>

            {pdfPreview && (
              <div className="pdf-preview">
                <iframe
                  src={pdfPreview}
                  title="PDF Preview"
                  width="100%"
                  height="300px"
                  style={{ marginTop: '20px' }}
                />
                <div className="page-range">
                  <div>
                    <label>Start Page:</label>
                    <input
                      type="number"
                      min="1"
                      max={pageRange.end}
                      value={pageRange.start}
                      onChange={(e) => handlePageRangeChange('start', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>End Page:</label>
                    <input
                      type="number"
                      min={pageRange.start}
                      max={totalPages}
                      value={pageRange.end}
                      onChange={(e) => handlePageRangeChange('end', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="qplusout">
            <div className="search-cont">
              <textarea
                placeholder="Type something here..."
                id="promptInput"
                className="input"
                name="text"
                value={searchQuery}
                onChange={(e) => {
                  handleSearchInputChange(e);
                  autoResize();
                }}
                ref={textareaRef}
              />
              <button
                onClick={handleSearch}
                className="enterbtn"
              >
                Ask
              </button>
            </div>

            <div className="output">
              {isLoading ? (
                <p style={{ color: '#3b82f6', fontWeight: '500' }}>Loading response...</p>
              ) : searchResults.length > 0 ? (
                <div className="educational-content">
                  {searchResults.map((result, index) => (
                    <div key={index} className="result-card">
                      <div className="content-section">
                        {result.summary.split('\n\n').map((section, sectionIndex) => {
                          if (section.startsWith('**') && section.endsWith('**')) {
                            return (
                              <h3 key={sectionIndex} className="section-heading">
                                {section.replace(/\*\*/g, '')}
                              </h3>
                            );
                          } else if (section.includes('**')) {
                            const [heading, ...points] = section.split('\n');
                            return (
                              <div key={sectionIndex} className="section-with-points">
                                <h4 className="subsection-heading">
                                  {heading.replace(/\*\*/g, '')}
                                </h4>
                                <ul className="points-list">
                                  {points.map((point, pointIndex) => (
                                    <li key={pointIndex}>
                                      {point.replace(/\*\*/g, '').trim()}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          } else {
                            return (
                              <p key={sectionIndex} className="content-paragraph">
                                {section}
                              </p>
                            );
                          }
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No results yet. Upload a PDF and enter a query to search.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
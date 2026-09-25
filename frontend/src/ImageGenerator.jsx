import React, { useState } from 'react';

export const CLOUDFLARE_WORKER_URL = "https://ai.zenoa.nz";
export const CLOUDFLARE_BEARER = "";

function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Please enter a design prompt first.");
    setLoading(true);
    setImageSrc(null); // Clear previous image
    
    try {
      // Connects directly to your live, verified Cloudflare custom route endpoint
      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_BEARER}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: prompt, aspect_ratio: aspectRatio })
      });

      if (!response.ok) {
        throw new Error(`API returned status code: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.image) {
        // Inject the base64 string directly inside an HTML5 data URI image parameter
        setImageSrc(`data:image/png;base64,${data.image}`);
      } else {
        alert("Generation failed. Image property not found in server response.");
      }
    } catch (error) {
      console.error("Frontend Routing Exception:", error);
      alert("Failed to connect to image generator API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#111', marginBottom: '8px' }}>AI Automation Workspace</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>Generate high-definition graphic assets on-the-fly using Cloudflare Workers AI.</p>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          placeholder="Describe the image you want to create..." 
          style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }}
          disabled={loading}
        />
        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} style={{ padding: '12px', borderRadius: '6px' }} disabled={loading}>
          <option value="1:1">1:1 (Square)</option>
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="9:16">9:16 (Portrait)</option>
          <option value="4:3">4:3 (Standard)</option>
        </select>

        <button 
          onClick={handleGenerate} 
          disabled={loading} 
          style={{ 
            padding: '12px 24px', 
            borderRadius: '6px', 
            backgroundColor: loading ? '#ccc' : '#0070f3', 
            color: '#fff', 
            border: 'none', 
            fontWeight: '6400',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      <div style={{ 
        textAlign: 'center', 
        minHeight: '350px', 
        border: '2px dashed #eaeaea', 
        borderRadius: '8px', 
        padding: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        {imageSrc ? (
          <img src={imageSrc} alt="AI Generation Output" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        ) : (
          <p style={{ color: '#999', fontSize: '14px' }}>Your generated visual asset will render here instantly</p>
        )}
      </div>
    </div>
  );
}

export default ImageGenerator;

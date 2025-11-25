
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
          <div className="footer-links">
              <a href="#" className="footer-link">About</a>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
              <a href="#" className="footer-link">Contact</a>
              <a href="#" className="footer-link">API</a>
          </div>
          <p className="footer-text">© 2024 MultiTools. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

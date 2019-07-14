import React from 'react'

import './index.scss'

export const Footer = () => (
  <footer className="footer">
    ©<a href="https://dowha.kim">Dowha</a>, Built with{' '}
    <a href="https://github.com/JaeYeopHan/gatsby-starter-bee" target="_blank">
      Gatsby-starter-bee
    </a>
  </footer>
  <div dangerouslySetInnerHTML={createMarkup()} />
)

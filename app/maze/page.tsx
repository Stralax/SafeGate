// frontend/app/maze/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

import { completeGame } from '@/lib/game-flow';

export default function MazePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Expose a hook for the maze script to call when the game ends.
    // score: 1.0 = pass, 0.0 = fail (binary game)
    (window as any).__safegateComplete = (score: number) => {
      delete (window as any).__safegateComplete;
      completeGame(score, '/maze', router);
    };
    return () => {
      delete (window as any).__safegateComplete;
    };
  }, [router]);

  return (
    <>
      {/* CSS za maze */}
      <style jsx global>{`
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          font-family: 'Roboto', sans-serif;
          background: #141E30;
          background: -webkit-linear-gradient(to left, #243B55, #141E30);
          background: linear-gradient(to left, #243B55, #141E30);
        }
        
        .game {
          font-family: 'Amatic SC', cursive;
          font-size: 14pt;
        }

        .menu {
          max-width: 100%;
          max-height: 100%;
          width: 380px;
          margin-left: auto;
          margin-right: auto;
        }

        .menu-items {
          margin-top: 60px;
          width: 244px;
          margin-left: auto;
          margin-right: auto;
        }

        .menu h1 {
          color: white;
          margin-top: 140px;
          font-size: 38pt;
          text-align: center;
          font-family: 'Rye', cursive;
        }

        .menu h2 {
          text-align: center;
          color: white;
          font-family: 'Bree Serif', serif;
        }

        .btn-create-own {
          color: white;
          text-decoration: none;
          position: fixed;
          bottom: 20px;
          left: 0px;
          text-align: center;
          width: 100%;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.78);
        }

        .btn-create-own:hover {
          text-decoration: underline;
        }

        .menu a {
          color: white;
          text-decoration: none;
          text-transform: uppercase;
          display: block;
          width: 160px;
          text-align: center;
          margin-top: 20px;
          -moz-box-shadow: 3px 4px 0px 0px #5287b5;
          -webkit-box-shadow: 3px 4px 0px 0px #5287b5;
          box-shadow: 3px 4px 0px 0px #5287b5;
          background-color: #79bbff;
          border: 1px solid #337bc4;
          cursor: pointer;
          color: #ffffff;
          font-family: Arial;
          font-size: 24pt;
          font-weight: bold;
          padding: 12px 44px;
          text-decoration: none;
          text-shadow: 0px 1px 0px #528ecc;
        }

        .menu input {
          width: 248px;
          background-color: rgb(255, 255, 255);
          border: 2px solid rgb(255, 255, 255);
          box-shadow: rgba(0, 0, 0, 0.33) 0px 1px 1px 0px inset;
          box-sizing: border-box;
          color: rgb(136, 136, 136);
          display: block;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          height: 52px;
          padding: 8px;
        }

        .menu a:nth-child(3) {
          font-size: 16pt;
        }

        .menu a:active {
          position: relative;
          top: 1px;
        }

        .menu a:hover {
          background-color: #378ee5;
        }

        .game {
          display: block;
        }

        .editor-ui {
          display: none;
        }

        .input-data {
        }

        .btn-map-data {
          position: fixed;
          top: 60px;
          right: 45px;
          color: white;
        }

        .btn-start {
          position: fixed;
          margin-left: 0px;
          margin-top: 0px;
          width: 24px;
          height: 24px;
          color: white;
          background-color: rgba(21, 214, 38, 0.7);
          display: none;
          text-align: center;
          font-weight: bold;
          text-decoration: none;
          line-height: 24px;
          cursor: none;
        }

        .btn-play-map {
          top: 20px;
          right: 20px;
          position: fixed;
          margin-left: -50px;
          display: block;
          width: 100px;
          color: white;
        }

        .btn-hide-map-data {
          color: white;
          margin: 10px;
          width: 100px;
          display: inline-block;
        }

        .map-data {
          color: white;
          top: 110px;
          right: 20px;
          position: fixed;
          max-width: 200px;
          width: 200px;
          word-wrap: normal;
        }

        .win-overlay, .lose-overlay {
          display: none;
          width: 100%;
          height: 100%;
          top: 0px;
          left: 0px;
          position: fixed;
          z-index: 999999999;
          pointer-events: none;
        }

        .message-overlay {
          font-family: 'Amatic SC', cursive;
          text-align: center;
          top: 50%;
          position: relative;
          margin-top: -40px;
          color: white;
          font-size: 18pt;
        }

        .image-overlay {
          width: 100%;
          height: 100%;
        }

        .selectors {
          font-family: 'Open Sans', sans-serif;
          position: fixed;
          bottom: 0px;
          width: 100%;
          height: 64px;
          background-color: rgba(44, 62, 80, 1.0);
          border-top: 1px solid rgba(52, 73, 94, 1.0);
          border-bottom: 1px solid rgb(44, 44, 44);
        }

        .audio-selector, .image-selector {
          height: 42px;
          width: 42px;
          border-top: 2px solid rgb(44, 44, 44);
          border-left: 2px solid rgb(44, 44, 44);
          border-right: 2px solid rgba(52, 73, 94, 1.0);
          border-bottom: 2px solid rgba(52, 73, 94, 1.0);
          margin-left: 5px;
          margin-top: 5px;
          cursor: pointer;
        }

        .image-selector.selected, .audio-selector.selected {
          border: 2px solid rgb(255, 0, 0) !important;
        }

        .image-selectors .header, .audio-selectors .header {
          color: white;
          margin-left: 5px;
          margin-top: 5px;
          font-size: 14pt;
        }

        .audio-selectors, .image-selectors {
          margin-left: 5px;
          margin-top: 5px;
        }

        .game-ui {
          display: block;
          position: fixed;
          color: white;
          font-family: 'Open Sans', sans-serif;
          margin-left: 20px;
          margin-top: 20px;
        }

        .lives-display {
          font-size: 16pt;
          letter-spacing: 4px;
          margin-bottom: 4px;
        }

        .timer-display {
          font-size: 14pt;
          font-family: 'Roboto', sans-serif;
          color: white;
          margin-bottom: 6px;
          font-weight: bold;
        }

        .banned-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.93);
          z-index: 9999999999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .banned-title {
          color: #e74c3c;
          font-family: 'Rye', cursive;
          font-size: 52pt;
          margin-bottom: 24px;
          text-shadow: 0 0 30px rgba(231, 76, 60, 0.8);
        }

        .banned-reason {
          color: white;
          font-family: 'Bree Serif', serif;
          font-size: 16pt;
          text-align: center;
          max-width: 520px;
          padding: 20px;
          line-height: 1.5;
        }

        .banned-sub {
          color: rgba(255, 255, 255, 0.35);
          font-family: 'Roboto', sans-serif;
          font-size: 10pt;
          margin-top: 20px;
        }

        /* NOVI STILI ZA ZMAGOVALNO SPOROČILO */
        .win-message-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 9999999999;
          pointer-events: none;
        }

        .win-message-box {
          background: #2ecc71;
          padding: 30px 50px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 0 30px rgba(46, 204, 113, 0.5);
          border: 3px solid #27ae60;
          animation: popIn 0.5s ease-out;
        }

        .win-message-box h2 {
          color: white;
          font-family: 'Bree Serif', sans-serif;
          font-size: 3rem;
          margin: 0 0 10px 0;
          text-shadow: 2px 2px 0 #1e8449;
        }

        .win-message-box p {
          color: white;
          font-family: 'Roboto', sans-serif;
          font-size: 1.8rem;
          margin: 0;
          font-weight: bold;
        }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Font Awesome in Google Fonts */}
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" />
      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Amatic+SC" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Bree+Serif" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Francois+One" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css?family=Rye" rel="stylesheet" />

      {/* HTML struktura */}
      <div className="menu" style={{ display: 'none' }}>
        <input type="text" className="input-data" style={{ display: 'none' }} />
      </div>

      <div className="game">
        <div className="editor-ui" style={{ display: 'none' }}>
          <div className="selectors">
            <div className="audio-selectors"></div>
            <div className="image-selectors">
              <div>
                <img src="//www.scaryforkids.com/pics/scary-movie.jpg" className="image-selector selected" id="img0" />
                <img src="//orion-uploads.openroadmedia.com/lg_380efe-pennywiseweb.jpg" className="image-selector" id="img1" />
                <img src="//yt3.ggpht.com/-wT3VNeh42u0/AAAAAAAAAAI/AAAAAAAAAAA/yuwi_GW69dI/s900-c-k-no-mo-rj-c0xffffff/photo.jpg" className="image-selector" id="img2" />
                <img src="//media.giphy.com/media/LLHkw7UnvY3Kw/giphy.gif" className="image-selector" id="img3" />
              </div>
            </div>
          </div>
          <a href="#" className="btn-map-data" onClick={(e) => { e.preventDefault(); (window as any).toggleMapData?.(); }}>Toggle sharable map data</a>
          <a href="#" className="btn-play-map" onClick={(e) => { e.preventDefault(); (window as any).togglePreview?.(); }}>Toggle preview</a>
          <span className="map-data"></span>
        </div>

        <div className="game-ui">
          <div className="lives-display">❤️❤️❤️</div>
          <div className="timer-display">⏱️ 0s</div>
          <span>Move your mouse to the green field S to start.</span><br />
          <span>Reach the goal without touching the walls.</span><br />
          <span>You have 3 lives and 30 seconds. Good luck!</span>
        </div>

        <a href="#" className="btn-start" onMouseOver={() => (window as any).startGame?.()}>S</a>
        <canvas className="le-canvas" ref={canvasRef}></canvas>
      </div>

      <div className="lose-overlay">
        <div className="message-overlay">
          Oops! You touched the wall!<br />Move your mouse back to the start S to try again!
        </div>
      </div>

      <div className="banned-overlay">
        <div className="banned-title">GAME OVER</div>
        <div className="banned-reason"></div>
        <div className="banned-sub"></div>
      </div>

      {/* Uvoz skripte */}
      <Script src="/games/maze/script.js" strategy="afterInteractive" />
    </>
  );
}
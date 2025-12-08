import React, { useState } from 'react';
import { ParallaxImages } from './components/ParallaxImages';

function App() {
  const [stage, setStage] = useState(0);
  // 0 = DragUnlock
  // 1 = Entrance
  // 2 = Main Experience

  return (
    <main className="w-full min-h-screen bg-[#F5F5DC]">

      {stage === 0 && (
        <>
          <ParallaxImages />
        </>
      )}

    </main>
  );
}

export default App;

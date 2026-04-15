import { Assets, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

const useSlotTextures = () => {
  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Prevents setState if the component unmounts
    // before the async loading finishes
    let mounted = true;

    const load = async () => {
      const [atlas, frame] = await Promise.all([
        Assets.load('/assets/texture.json'),
        Assets.load('/assets/frame.png'),
      ]);

      // Stops if the component has already unmounted
      if (!mounted) return;

      setTextures({
        // Atlas may return either a .textures object or the textures directly
        ...(atlas.textures ?? atlas),
        frame,
      });

      setLoaded(true);
    };

    load();

    return () => {
      // Marks the hook as unmounted so async loading cannot update state later
      mounted = false;
    };
  }, []);

  return { textures, loaded };
};

export default useSlotTextures;

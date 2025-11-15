import { ProjectTemplate } from '../types';

export const templates: ProjectTemplate[] = [
  {
    id: 'template_scifi_short',
    name: 'Sci-Fi Short',
    description: 'A starting point for a futuristic story, featuring a robot character, a neon-lit city background, and a basic scene.',
    thumbnailUrl: 'https://picsum.photos/seed/scifi/400/300',
    projectData: {
      script: 'SCENE 1\n\nINT. CYBERPUNK ALLEY - NIGHT\n\nUNIT 734, a sleek android, stands in the rain, neon signs reflecting off its chrome chassis. It looks down at a flickering holographic map in its palm.\n\nUNIT 734\n(V.O.)\nAnother dead end. The signal was clear, but the target is gone. They always are.',
      assets: [
        {
          id: 'asset_robot_char',
          name: 'Unit 734',
          type: 'character',
          url: 'https://picsum.photos/seed/robot/512/512',
          tags: ['robot', 'android', 'sci-fi', 'character'],
        },
        {
          id: 'asset_city_bg',
          name: 'Cyberpunk Alley',
          type: 'background',
          url: 'https://picsum.photos/seed/cyberpunk/1920/1080',
          tags: ['city', 'sci-fi', 'neon', 'background'],
        },
      ],
      scenes: [
        {
          id: 'scene_1_template',
          number: 1,
          script: 'Unit 734 stands in the rain, looking at a map.',
          duration: 10,
          cameraMovement: 'dolly',
          cameraAngle: 'low-angle',
          characters: [
            {
              id: 'sc_char_robot',
              assetId: 'asset_robot_char',
              position: 'center',
              animation: 'idle',
              movement: 'none',
              animationStyle: 'realistic',
              animationLayers: { talking: {} },
            },
          ],
          dialogue: [],
          backgroundAssetId: 'asset_city_bg',
          storyboardPanels: [],
          backgroundMusicAssetId: null,
          soundEffects: [],
        },
      ],
      data: { duration: 10, layers: [] },
      styleProfiles: [],
      currentStyleReference: null,
      projectWideMusicAssetId: null,
    },
  },
  {
    id: 'template_fantasy_intro',
    name: 'Fantasy Adventure Intro',
    description: 'Begin a magical quest with a brave knight, a mysterious forest background, and an opening scene with dialogue.',
    thumbnailUrl: 'https://picsum.photos/seed/fantasy/400/300',
    projectData: {
      script: 'SCENE 1\n\nEXT. ENCHANTED FOREST - DAY\n\nSIR Kaelan, a knight in shining armor, pushes aside a large fern, revealing a clearing. A mischievous Sprite hovers before him.\n\nSPRITE\nTook you long enough, slowpoke!\n\nSIR KAELAN\nYour riddles are unnecessarily cryptic. Where is the Sunstone?',
      assets: [
        {
          id: 'asset_knight_char',
          name: 'Sir Kaelan',
          type: 'character',
          url: 'https://picsum.photos/seed/knight/512/512',
          tags: ['knight', 'hero', 'fantasy', 'character'],
        },
        {
          id: 'asset_sprite_char',
          name: 'Sprite',
          type: 'character',
          url: 'https://picsum.photos/seed/sprite/512/512',
          tags: ['fairy', 'sprite', 'magical', 'character'],
        },
        {
          id: 'asset_forest_bg',
          name: 'Enchanted Forest',
          type: 'background',
          url: 'https://picsum.photos/seed/forest/1920/1080',
          tags: ['forest', 'fantasy', 'nature', 'background'],
        },
      ],
      scenes: [
        {
          id: 'scene_1_fantasy_template',
          number: 1,
          script: 'The knight confronts the sprite.',
          duration: 8,
          cameraMovement: 'pan-right',
          cameraAngle: 'eye-level',
          characters: [
            {
              id: 'sc_char_knight',
              assetId: 'asset_knight_char',
              position: 'left',
              animation: 'talking',
              movement: 'none',
              animationStyle: 'squash-and-stretch',
              animationLayers: { talking: {} },
            },
             {
              id: 'sc_char_sprite',
              assetId: 'asset_sprite_char',
              position: 'right',
              animation: 'talking',
              movement: 'none',
              animationStyle: 'bouncy',
              animationLayers: { talking: {} },
            },
          ],
          dialogue: [
            {
              id: 'dlg_1',
              characterId: 'sc_char_sprite',
              line: 'Took you long enough, slowpoke!',
              emotion: 'happy',
              audioAssetId: null
            },
            {
              id: 'dlg_2',
              characterId: 'sc_char_knight',
              line: 'Your riddles are unnecessarily cryptic. Where is the Sunstone?',
              emotion: 'neutral',
              audioAssetId: null
            }
          ],
          backgroundAssetId: 'asset_forest_bg',
          storyboardPanels: [],
          backgroundMusicAssetId: null,
          soundEffects: [],
        },
      ],
      data: { duration: 8, layers: [] },
      styleProfiles: [],
      currentStyleReference: null,
      projectWideMusicAssetId: null,
    },
  },
];

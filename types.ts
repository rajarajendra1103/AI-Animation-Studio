export interface Clip {
  id: string;
  type: 'text' | 'image' | 'shape' | 'audio' | 'video';
  start: number; // in seconds
  duration: number; // in seconds
  content: string; // e.g., text content, image URL, video URL
  color: string; // for visualization on the timeline
}

export interface Layer {
  id: string;
  name: string;
  clips: Clip[];
}

export interface TimelineData {
  duration: number; // total duration in seconds
  layers: Layer[];
}

export type AssetType = 'character' | 'background' | 'prop' | 'audio' | 'music' | 'effect' | 'video' | 'storyboard';

export interface AiAssetMetadata {
  description: string;
  detectedObjects: string[];
  sceneContext: string;
  mood: string;
  dominantColors: string[];
  composition: string;
  suggestedUsage: string;
  artStyle: string;
  colorPaletteDescription: string;
  lighting: string;
  lineQuality: string;
  artisticTone: string;
  searchKeywords: string[];
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string; // data URL or remote URL
  tags: string[];
  duration?: number; // for video/audio
  aiMetadata?: AiAssetMetadata;
}


export interface StyleProfile {
  id: string;
  name: string;
  description: string;
}

export type CameraMovement = 'none' | 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'dolly' | 'static' | 'truck';
export type CameraAngle = 'eye-level' | 'high-angle' | 'low-angle' | 'birds-eye' | 'worms-eye';
export type CharacterPosition = 'left' | 'center' | 'right' | 'upstage' | 'downstage' | 'stage-left' | 'stage-right';
export type CharacterAnimation = 'idle' | 'walking' | 'talking' | 'action';
export type CharacterMovement = 'none' | 'enter-left' | 'enter-right' | 'exit-left' | 'exit-right';
export type DialogueEmotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
export type AnimationStyle = 'squash-and-stretch' | 'limited' | 'realistic' | 'bouncy' | 'robotic';

export interface SoundEffect {
  id: string;
  assetId: string;
  startTime: number; // in seconds, relative to scene start
  volume: number; // 0 to 1
}

export interface StoryboardPanel {
  id: string;
  panelNumber: number;
  timing: string;
  shotType: string;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  visualDescription: string;
  characterPose: string;
  keyVisualElements: string;
  lightingAndMood: string;
  backgroundDetails: string;
  transition: string;
  directorsNotes: string;
  dialogueSnippet: string;
  imageUrl: string;
}

export interface SceneDialogue {
  id: string;
  characterId: string;
  line: string;
  emotion: DialogueEmotion;
  audioAssetId: string | null;
}

export interface AnimationData {
  type: 'idle' | 'walking' | 'talking';
  frames: string[]; // For sprite sheets, usually one URL. For talking, can be multiple mouth shapes.
  duration: number;
  meta?: {
    phonemes?: { phoneme: string; mouthShape: string; start: number; end: number }[]; // For lip-sync data
  };
}

export interface SceneCharacter {
  id: string; // unique ID for this instance in the scene
  assetId: string; // links to the Asset
  position: CharacterPosition;
  animation: CharacterAnimation;
  movement: CharacterMovement;
  animationStyle: AnimationStyle;
  animationLayers: {
    idle?: AnimationData;
    walking?: AnimationData;
    talking: { [dialogueId: string]: AnimationData };
  };
}

export interface Scene {
  id: string;
  number: number;
  script: string;
  duration: number; // in seconds
  cameraMovement: CameraMovement;
  cameraAngle: CameraAngle;
  characters: SceneCharacter[];
  dialogue: SceneDialogue[];
  backgroundAssetId: string | null;
  storyboardPanels: StoryboardPanel[];
  backgroundMusicAssetId: string | null;
  soundEffects: SoundEffect[];
}

export interface SceneAnalysis {
  overallAssessment: {
    score: number;
    strengths: string;
    weaknesses: string;
    priorities: string[];
  };
  composition: {
    arrangement: string;
    focalPoint: string;
    balance: string;
  };
  cameraWork: {
    recommendedAngle: CameraAngle;
    recommendedMovement: CameraMovement;
    reasoning: string;
  };
  pacing: {
    currentDuration: number;
    recommendedDuration: number;
    rationale: string;
  };
  emotionalImpact: {
    targetEmotion: string;
    techniqueSuggestions: string[];
  };
  characterChoreography: {
    blocking: {
      character: string;
      startPosition: CharacterPosition;
      movementPath: string;
      keyPoses: string;
    }[];
  };
  visualFlow: {
    continuityNotes: string;
    lighting: string;
    mood: string;
  };
}

export interface Project {
  id:string;
  name: string;
  description?: string;
  thumbnailUrl: string;
  lastModified: string;
  data: TimelineData;
  script?: string;
  assets: Asset[];
  styleProfiles: StyleProfile[];
  currentStyleReference: StyleProfile | null;
  scenes: Scene[];
  projectWideMusicAssetId: string | null;
}

export interface GeneratedScene {
  sceneNumber: number;
  setting: string;
  characters: string[];
  action: string;
  dialogue: { character: string; line: string }[];
}

export interface GeneratedShot {
  shotNumber: number;
  shotType: string;
  shotDescription: string;
  cameraMovement: CameraMovement;
  cameraAngle: CameraAngle;
  duration: number;
  characters: {
    name: string;
    position: CharacterPosition;
    action: string;
    emotion: DialogueEmotion;
  }[];
  dialogue: {
    character: string;
    line: string;
  }[];
  backgroundDescription: string;
  storyboardDescription: string;
}

export interface AnimatedAsset {
  id: string;
  name: string;
  videoUrl: string;
  duration: number;
}

export interface SearchCriteria {
  assetTypes: AssetType[];
  descriptors: string[];
  actions: string[];
  context: string;
  mood: string;
  colors: string[];
}

export interface SearchResult {
  asset: Asset;
  score: number;
  reasons: string[];
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  projectData: Omit<Project, 'id' | 'lastModified' | 'name' | 'description' | 'thumbnailUrl'>;
}
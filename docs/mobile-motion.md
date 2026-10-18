# Mobile motion and hero actions

Owner request, 18 October 2026: enable the existing gallery and footer motion on mobile, make both FAQ actions full width, and replace the mobile hero projects button with a scroll cue below the video.

Both About image galleries now use the desktop looping drift, horizontal drag and scattered-card interaction at every width. Touch gestures lock to the first movement axis; vertical swipes continue scrolling the page. Drift runs only while the track is visible and the document is shown. Reduced motion and no JavaScript retain a native horizontally scrollable gallery with duplicate cards hidden.

The mobile footer uses the desktop parallax reveal and staggered wordmark letters, with the existing photograph clipped through the glyphs and the round i dot. The photo is loaded near the viewport. Reduced motion removes the spatial animation and preserves the image fill; no JavaScript leaves solid readable text.

Below 1024px, the hero's description/projects-action group is hidden. A dictionary-owned **גללו לגלות** text-and-arrow anchor appears directly below the video and links to `#advantages`, before the logos. The desktop projects action remains. Both FAQ contact actions fill the available content width within the existing gutters.

Latest owner correction: keep the secondary-yellow mobile research pills, and restore their original compact stage and gentle falling animation. The temporary static layout and expanded stage were reverted. Reduced motion retains the original static fallback. Both FAQ contact actions use the same liquid silhouette, and the AI sparkle is enlarged to 36px.

Browser coverage in `tests/navigation/mobile-motion.spec.ts` exercises real horizontal/vertical touch gestures, both looping galleries, mobile action geometry and scroll navigation, footer entry/final/reverse states, image masks, and reduced-motion fallbacks. Existing hero and FAQ tests cover responsive video playback, logo placement and chat behavior.

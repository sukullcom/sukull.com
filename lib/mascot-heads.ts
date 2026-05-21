/**
 * `public/heads/*` maskot seti — spinner, ders tamamlama vb. için rastgele seçim.
 */
export const MASCOT_HEADS = [
  "/heads/ambitious_red.svg",
  "/heads/forgiveness_light_blue.svg",
  "/heads/happy_excited_purple.svg",
  "/heads/happy_heart_cute_pink.svg",
  "/heads/heart_with_hand_light_blue.svg",
  "/heads/hi_orange.svg",
  "/heads/hopeful_orange.svg",
  "/heads/liked_purple.svg",
  "/heads/look_my_eyes_dark_blue.svg",
  "/heads/look_my_eyes_orange.svg",
  "/heads/notr_yellow.svg",
  "/heads/okay_happy_yellow.svg",
  "/heads/perfect_pink.svg",
  "/heads/pointing_finger_happy_orange.svg",
  "/heads/sad_blue.svg",
  "/heads/sad_dark_blue.svg",
  "/heads/showing_with_hand_dark_blue.svg",
  "/heads/sleeping_blue.svg",
  "/heads/suprised_yellow.svg",
  "/heads/thoughtful_blue.svg",
  "/heads/twinkle_eye_purple.svg",
] as const;

export function pickRandomMascotHead(): string {
  return MASCOT_HEADS[Math.floor(Math.random() * MASCOT_HEADS.length)];
}

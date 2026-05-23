INSERT INTO specialty_catalog (code, label_ko, display_order, active)
VALUES
  ('adult_psychopathology', '성인 정신병리', 10, true),
  ('child_psychopathology', '아동·청소년 정신병리', 20, true),
  ('neuropsych', '신경심리평가', 30, true),
  ('personality_assessment', '성격평가', 40, true),
  ('cognitive_assessment', '인지평가', 50, true),
  ('projective', '투사검사', 60, true),
  ('forensic', '법정·감정 평가', 70, true),
  ('geriatric', '노인심리평가', 80, true),
  ('trauma', '외상·PTSD', 90, true),
  ('addiction', '중독', 100, true),
  ('autism', '자폐스펙트럼', 110, true),
  ('learning_disorder', '학습장애', 120, true)
ON CONFLICT (code) DO NOTHING;

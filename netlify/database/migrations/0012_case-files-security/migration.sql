ALTER TABLE case_files
  ADD CONSTRAINT case_files_size_positive CHECK (size_bytes > 0);--> statement-breakpoint
ALTER TABLE case_files
  ADD CONSTRAINT case_files_checksum_sha256_format
  CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[a-f0-9]{64}$');--> statement-breakpoint
CREATE UNIQUE INDEX case_files_storage_key_unique
ON case_files (storage_key);--> statement-breakpoint

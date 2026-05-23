# Role Matrix Audit

- Generated: 2026-05-22T21:42:01.738Z
- Total probes: 53
- Actor coverage: public 21, supervisee 15, supervisor 11, admin 6
- Results with findings: 0

## Findings

No findings.
## Probe Inventory

- OK public-home public /
- OK public-supervisors public /supervisors
- OK public-supervisors-query public /supervisors?q=인지
- OK public-supervisors-qualification public /supervisors?qualification=정신건강임상심리사%201급
- OK public-supervisors-specialty public /supervisors?specialty=neuropsych
- OK public-supervisors-availability public /supervisors?availability=this_week
- OK public-supervisors-page-2 public /supervisors?page=2
- OK public-supervisor-1 public /supervisors/10000000-0000-4000-8000-000000000101
- OK public-supervisor-2 public /supervisors/10000000-0000-4000-8000-000000000103
- OK public-supervisor-3 public /supervisors/10000000-0000-4000-8000-000000000104
- OK public-supervisor-4 public /supervisors/10000000-0000-4000-8000-000000000105
- OK public-supervisor-5 public /supervisors/10000000-0000-4000-8000-000000000106
- OK public-supervisor-6 public /supervisors/10000000-0000-4000-8000-000000000107
- OK public-resources public /resources
- OK public-privacy public /privacy
- OK public-terms public /terms
- OK public-sensitive-consent public /sensitive-consent
- OK public-security public /security
- OK public-guidelines public /clinical-guidelines
- OK public-login public /login
- OK public-signup public /signup
- OK supervisee-requests supervisee /requests
- OK supervisee-new-basic supervisee /requests/new
- OK supervisee-new-prefilled supervisee /requests/new?supervisorId=10000000-0000-4000-8000-000000000101&serviceProductId=10000000-0000-4000-8000-000000000301&slot=2032-03-22%20%EC%9B%94%2010%3A21-11%3A21&slotStart=2032-03-22T01%3A21%3A00.000Z&slotEnd=2032-03-22T02%3A21%3A00.000Z
- OK supervisee-request-1 supervisee /requests/10000000-0000-4000-8000-000000000601
- OK supervisee-request-2 supervisee /requests/10000000-0000-4000-8000-000000000602
- OK supervisee-request-3 supervisee /requests/10000000-0000-4000-8000-000000000603
- OK supervisee-request-4 supervisee /requests/10000000-0000-4000-8000-000000000604
- OK supervisee-request-5 supervisee /requests/10000000-0000-4000-8000-000000000605
- OK supervisee-request-6 supervisee /requests/10000000-0000-4000-8000-000000000606
- OK supervisee-request-7 supervisee /requests/10000000-0000-4000-8000-000000000607
- OK supervisee-request-8 supervisee /requests/10000000-0000-4000-8000-000000000608
- OK supervisee-request-9 supervisee /requests/10000000-0000-4000-8000-000000000609
- OK supervisee-payments supervisee /payments
- OK supervisee-paid-payment supervisee /payments/10000000-0000-4000-8000-000000000701
- OK supervisee-settings supervisee /settings
- OK supervisor-home supervisor /supervisor
- OK supervisor-profile supervisor /supervisor/profile
- OK supervisor-qualifications supervisor /supervisor/qualifications
- OK supervisor-products supervisor /supervisor/products
- OK supervisor-availability supervisor /supervisor/availability
- OK supervisor-requests supervisor /supervisor/requests
- OK supervisor-payouts supervisor /supervisor/payouts
- OK supervisor-request-1 supervisor /supervisor/requests/10000000-0000-4000-8000-000000000602
- OK supervisor-request-2 supervisor /supervisor/requests/10000000-0000-4000-8000-000000000603
- OK supervisor-request-3 supervisor /supervisor/requests/10000000-0000-4000-8000-000000000604
- OK supervisor-request-4 supervisor /supervisor/requests/10000000-0000-4000-8000-000000000608
- OK admin-home admin http://localhost:3001/admin
- OK admin-qualifications admin http://localhost:3001/admin/qualifications
- OK admin-refunds admin http://localhost:3001/admin/refunds
- OK admin-payouts admin http://localhost:3001/admin/payouts
- OK admin-audit admin http://localhost:3001/admin/audit
- OK admin-root admin http://localhost:3001/

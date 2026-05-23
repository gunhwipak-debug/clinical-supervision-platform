# Stitch Manual Override Sources

This file preserves the user-supplied Stitch HTML samples in Markdown form so a goal runner can reference one durable source document.

The canonical executable/static source files are also preserved byte-for-byte under `designs/stitch/manual-overrides/`. If this Markdown and an `.html` file ever disagree, treat the `.html` file as canonical and regenerate this document.

| Section | Target route | Source file |
| --- | --- | --- |
| `supervisor-catalog.html` | `/supervisors` | `designs/stitch/manual-overrides/supervisor-catalog.html` |
| `supervisor-profile.html` | `/supervisors/[id]` | `designs/stitch/manual-overrides/supervisor-profile.html` |
| `new-request.html` | `/requests/new` | `designs/stitch/manual-overrides/new-request.html` |
| `availability-calendar.html` | `/supervisor/availability and public booking slots` | `designs/stitch/manual-overrides/availability-calendar.html` |
| `work-surface.html` | `/supervisor/requests/[id]` | `designs/stitch/manual-overrides/work-surface.html` |

## supervisor-catalog.html

Target route: `/supervisors`

```html
<!DOCTYPE html>

<html class="light" lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Supervisor Catalog - ClinicFlow</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "error-container": "#ffdad6",
                    "on-tertiary": "#ffffff",
                    "on-surface": "#111c2d",
                    "on-primary-fixed-variant": "#3f465c",
                    "tertiary-fixed-dim": "#c0c7d0",
                    "surface-container-lowest": "#ffffff",
                    "surface-container-highest": "#d8e3fb",
                    "on-tertiary-container": "#7d858d",
                    "inverse-on-surface": "#ecf1ff",
                    "outline-variant": "#c6c6cd",
                    "inverse-primary": "#bec6e0",
                    "secondary": "#0058be",
                    "on-secondary-fixed-variant": "#004395",
                    "on-primary": "#ffffff",
                    "surface": "#f9f9ff",
                    "on-tertiary-fixed-variant": "#40484f",
                    "error": "#ba1a1a",
                    "surface-container-low": "#f0f3ff",
                    "tertiary-container": "#151c23",
                    "surface-tint": "#565e74",
                    "primary-container": "#131b2e",
                    "surface-container-high": "#dee8ff",
                    "secondary-fixed-dim": "#adc6ff",
                    "tertiary-fixed": "#dce3ec",
                    "outline": "#76777d",
                    "on-primary-fixed": "#131b2e",
                    "surface-container": "#e7eeff",
                    "secondary-fixed": "#d8e2ff",
                    "on-secondary-container": "#fefcff",
                    "inverse-surface": "#263143",
                    "surface-variant": "#d8e3fb",
                    "primary": "#000000",
                    "on-secondary-fixed": "#001a42",
                    "primary-fixed": "#dae2fd",
                    "surface-dim": "#cfdaf2",
                    "tertiary": "#000000",
                    "secondary-container": "#2170e4",
                    "on-secondary": "#ffffff",
                    "on-tertiary-fixed": "#151c23",
                    "on-error-container": "#93000a",
                    "on-surface-variant": "#45464d",
                    "on-error": "#ffffff",
                    "on-background": "#111c2d",
                    "on-primary-container": "#7c839b",
                    "surface-bright": "#f9f9ff",
                    "primary-fixed-dim": "#bec6e0",
                    "background": "#f9f9ff"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "sm": "12px",
                    "container-max": "1280px",
                    "base": "8px",
                    "gutter": "24px",
                    "md": "16px",
                    "margin-mobile": "16px",
                    "xs": "4px",
                    "xl": "40px",
                    "lg": "24px"
            },
            "fontFamily": {
                    "label-md": [
                            "Inter"
                    ],
                    "label-sm": [
                            "Inter"
                    ],
                    "body-sm": [
                            "Inter"
                    ],
                    "headline-lg-mobile": [
                            "Hanken Grotesk"
                    ],
                    "body-md": [
                            "Inter"
                    ],
                    "headline-md": [
                            "Hanken Grotesk"
                    ],
                    "headline-lg": [
                            "Hanken Grotesk"
                    ],
                    "display-lg": [
                            "Hanken Grotesk"
                    ],
                    "body-lg": [
                            "Inter"
                    ]
            },
            "fontSize": {
                    "label-md": [
                            "14px",
                            {
                                    "lineHeight": "1",
                                    "letterSpacing": "0.01em",
                                    "fontWeight": "600"
                            }
                    ],
                    "label-sm": [
                            "12px",
                            {
                                    "lineHeight": "1",
                                    "fontWeight": "500"
                            }
                    ],
                    "body-sm": [
                            "14px",
                            {
                                    "lineHeight": "1.5",
                                    "fontWeight": "400"
                            }
                    ],
                    "headline-lg-mobile": [
                            "24px",
                            {
                                    "lineHeight": "1.3",
                                    "fontWeight": "600"
                            }
                    ],
                    "body-md": [
                            "16px",
                            {
                                    "lineHeight": "1.6",
                                    "fontWeight": "400"
                            }
                    ],
                    "headline-md": [
                            "24px",
                            {
                                    "lineHeight": "1.4",
                                    "fontWeight": "600"
                            }
                    ],
                    "headline-lg": [
                            "32px",
                            {
                                    "lineHeight": "1.3",
                                    "letterSpacing": "-0.01em",
                                    "fontWeight": "600"
                            }
                    ],
                    "display-lg": [
                            "48px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "-0.02em",
                                    "fontWeight": "700"
                            }
                    ],
                    "body-lg": [
                            "18px",
                            {
                                    "lineHeight": "1.6",
                                    "fontWeight": "400"
                            }
                    ]
            }
        },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col">
<!-- TopNavBar Shared Component -->
<header class="fixed top-0 w-full z-50 bg-surface dark:bg-inverse-surface px-gutter max-w-container-max mx-auto flex justify-between items-center h-16 border-b border-outline-variant dark:border-outline flat no shadows">
<div class="flex items-center gap-lg">
<div class="font-headline-md text-headline-md font-bold text-primary dark:text-inverse-primary cursor-pointer active:opacity-80">
                ClinicFlow
            </div>
<!-- Navigation Links -->
<nav class="hidden md:flex items-center gap-md ml-xl">
<!-- Find Supervisors (Active) -->
<a class="font-label-md text-label-md text-secondary dark:text-secondary-fixed border-b-2 border-secondary dark:border-secondary-fixed pb-1 cursor-pointer active:opacity-80" href="#">
                    Find Supervisors
                </a>
<!-- My Requests (Inactive) -->
<a class="font-label-md text-label-md text-on-surface-variant dark:text-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors cursor-pointer active:opacity-80" href="#">
                    My Requests
                </a>
<!-- Resources (Inactive) -->
<a class="font-label-md text-label-md text-on-surface-variant dark:text-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors cursor-pointer active:opacity-80" href="#">
                    Resources
                </a>
</nav>
</div>
<div class="flex items-center gap-md">
<!-- Trailing Icon Actions -->
<button class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer active:opacity-80 flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high">
<span class="material-symbols-outlined">security</span>
</button>
<button class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer active:opacity-80 flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high">
<span class="material-symbols-outlined">notifications</span>
</button>
<!-- Trailing Primary Action -->
<button class="hidden md:block bg-primary-container text-on-primary-fixed px-md py-2 rounded-lg font-label-md text-label-md hover:bg-surface-tint hover:text-on-primary transition-colors cursor-pointer active:opacity-80">
                Secure Login
            </button>
<!-- Profile Image Placeholder (Mobile Menu Trigger) -->
<div class="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden cursor-pointer active:opacity-80 md:hidden flex items-center justify-center">
<span class="material-symbols-outlined text-on-surface-variant">person</span>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-grow pt-[88px] pb-xl px-margin-mobile md:px-gutter max-w-container-max mx-auto w-full">
<!-- Header Section -->
<section class="mb-xl">
<h1 class="font-display-lg text-display-lg text-on-surface mb-base tracking-tight">임상 심리 전문가 찾기</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">신뢰할 수 있는 검증된 수퍼바이저와 함께 당신의 임상 역량을 한 단계 높이세요. 조건에 맞는 전문가를 검색하고 리뷰를 확인해보세요.</p>
</section>
<!-- Search & Filter Bar -->
<section class="bg-surface-container-lowest border border-outline-variant rounded-xl p-sm md:p-md shadow-sm mb-xl flex flex-col md:flex-row gap-sm items-center w-full z-10 relative">
<!-- Global Search -->
<div class="relative w-full md:flex-1">
<span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full pl-xl pr-sm py-2 bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-on-tertiary-container" placeholder="이름, 전문 분야 또는 자격증 검색" type="text"/>
</div>
<!-- Filters Group -->
<div class="flex flex-wrap md:flex-nowrap gap-sm w-full md:w-auto">
<select class="flex-1 md:w-40 appearance-none bg-surface border border-outline-variant rounded-lg px-sm py-2 font-label-md text-label-md text-on-surface focus:outline-none focus:border-secondary cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2345464d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] bg-[length:16px]">
<option disabled="" hidden="" selected="" value="">자격증 (Qualification)</option>
<option value="kcp">임상심리전문가 (KCP)</option>
<option value="kpa">정신건강임상심리사 1급</option>
<option value="counsel">상담심리사 1급</option>
</select>
<select class="flex-1 md:w-40 appearance-none bg-surface border border-outline-variant rounded-lg px-sm py-2 font-label-md text-label-md text-on-surface focus:outline-none focus:border-secondary cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2345464d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] bg-[length:16px]">
<option disabled="" hidden="" selected="" value="">전문 분야 (Specialty)</option>
<option value="cbt">인지행동치료 (CBT)</option>
<option value="trauma">트라우마 (Trauma)</option>
<option value="child">아동/청소년 (Child/Adolescent)</option>
</select>
<select class="flex-1 md:w-40 appearance-none bg-surface border border-outline-variant rounded-lg px-sm py-2 font-label-md text-label-md text-on-surface focus:outline-none focus:border-secondary cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2345464d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] bg-[length:16px]">
<option disabled="" hidden="" selected="" value="">예약 (Availability)</option>
<option value="this_week">이번 주 가능</option>
<option value="this_month">이번 달 가능</option>
</select>
</div>
</section>
<!-- Supervisor Grid -->
<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
<!-- Card 1 -->
<article class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col hover:bg-surface-bright hover:border-secondary-fixed-dim transition-all duration-200 group">
<div class="flex items-start gap-md mb-md">
<img alt="Supervisor Profile" class="w-20 h-20 rounded-full object-cover border border-outline-variant shadow-sm flex-shrink-0" data-alt="A professional headshot of a middle-aged Korean female clinical psychologist. She has a warm, empathetic expression and is wearing a crisp white blouse with a subtle navy blazer. The background is a softly blurred, modern clinic office with light grey walls and a hint of natural window light. The lighting is bright, even, and flattering, conveying a sense of medical professionalism and trustworthiness in a light-mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEoT-FlZUztaaReF3eqwgzqZgkEGO1tC11j44ElA_6kK_35QWOFPnOXALbD4p0RVCTIcn-0MkIETlBj8rFpyiO9oPgzx8ssOT2Ck7curseVGG6Z2Zf64CZXi7SZgss1bS88RVUTVcX4jbHLSFGRd39U2niNSRo05p5CFXicR17ivraRPQL2xT8tS0YtbiNpP5cLuqAyL4orFmO5r_4tTLgM-j_2Gs_aF41844M3tP-iXdpYo8jX7rXoZuyOf72i4fWbRwJLbqzl94"/>
<div class="flex-grow">
<div class="flex items-center justify-between w-full">
<h2 class="font-headline-md text-headline-md text-on-surface group-hover:text-secondary transition-colors">김지연 박사</h2>
<div class="flex items-center gap-xs bg-surface-container-highest px-2 py-0.5 rounded-full" title="Verified Professional">
<span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">verified</span>
<span class="font-label-sm text-label-sm text-secondary">검증됨</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">임상심리전문가 (KCP) / 정신건강임상심리사 1급</p>
<div class="flex items-center gap-xs mt-sm">
<span class="material-symbols-outlined text-secondary text-[18px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md text-on-surface">4.9</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">(124 리뷰)</span>
<span class="text-outline-variant mx-1">|</span>
<span class="font-label-sm text-label-sm text-on-surface">₩80,000 / 시간</span>
</div>
</div>
</div>
<div class="flex flex-wrap gap-xs mb-lg flex-grow">
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">인지행동치료 (CBT)</span>
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">성인 우울/불안</span>
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">트라우마</span>
</div>
<button class="w-full py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface group-hover:bg-primary-container group-hover:text-on-primary group-hover:border-primary-container transition-all cursor-pointer">
                    프로필 보기
                </button>
</article>
<!-- Card 2 -->
<article class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col hover:bg-surface-bright hover:border-secondary-fixed-dim transition-all duration-200 group">
<div class="flex items-start gap-md mb-md">
<img alt="Supervisor Profile" class="w-20 h-20 rounded-full object-cover border border-outline-variant shadow-sm flex-shrink-0" data-alt="A professional headshot of a young Korean male clinical psychologist. He is wearing wire-rimmed glasses, a light blue button-down shirt, and a dark grey clinical coat. He has a calm, reassuring smile. The setting is a minimalist, modern therapy room with light blue-grey tones, softly lit to create an atmosphere of safety and high-end clinical care." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAorCYkxGGG4c7MbcsCnZvL5W44wu-CpUzehfhiaKtpZnR2DxKg-OUgcdgJs_eV4r8cPVMLrDfJmjH9sfHO4jUaw77cpyva41sePc-TC9E3BDbe519YvSLaoWs0Jyr45VS70bXQWbua_OtnjqRUcECA9yWRU2dsH_kVlmMiZks_nfcBD5dvv7wX6Kv4mtqPdOJYbzNcfn98UINbXN0BDYCub__wXHx3PWHpaNc7JQvl826pvFQzPdCjRoBFFbEAJGwgvCVno1k5seE"/>
<div class="flex-grow">
<div class="flex items-center justify-between w-full">
<h2 class="font-headline-md text-headline-md text-on-surface group-hover:text-secondary transition-colors">이민호 소장</h2>
<div class="flex items-center gap-xs bg-surface-container-highest px-2 py-0.5 rounded-full" title="Verified Professional">
<span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">verified</span>
<span class="font-label-sm text-label-sm text-secondary">검증됨</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">상담심리사 1급 / 아동청소년 전문가</p>
<div class="flex items-center gap-xs mt-sm">
<span class="material-symbols-outlined text-secondary text-[18px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md text-on-surface">4.8</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">(89 리뷰)</span>
<span class="text-outline-variant mx-1">|</span>
<span class="font-label-sm text-label-sm text-on-surface">₩75,000 / 시간</span>
</div>
</div>
</div>
<div class="flex flex-wrap gap-xs mb-lg flex-grow">
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">아동/청소년</span>
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">가족 상담</span>
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">놀이치료</span>
</div>
<button class="w-full py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface group-hover:bg-primary-container group-hover:text-on-primary group-hover:border-primary-container transition-all cursor-pointer">
                    프로필 보기
                </button>
</article>
<!-- Card 3 -->
<article class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col hover:bg-surface-bright hover:border-secondary-fixed-dim transition-all duration-200 group">
<div class="flex items-start gap-md mb-md">
<div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant flex-shrink-0">
<span class="material-symbols-outlined text-outline text-3xl">person</span>
</div>
<div class="flex-grow">
<div class="flex items-center justify-between w-full">
<h2 class="font-headline-md text-headline-md text-on-surface group-hover:text-secondary transition-colors">박수진 교수</h2>
<div class="flex items-center gap-xs bg-surface-container-highest px-2 py-0.5 rounded-full" title="Verified Professional">
<span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">verified</span>
<span class="font-label-sm text-label-sm text-secondary">검증됨</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">정신건강임상심리사 1급 / 수련감독자</p>
<div class="flex items-center gap-xs mt-sm">
<span class="material-symbols-outlined text-secondary text-[18px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md text-on-surface">5.0</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">(210 리뷰)</span>
<span class="text-outline-variant mx-1">|</span>
<span class="font-label-sm text-label-sm text-on-surface">₩100,000 / 시간</span>
</div>
</div>
</div>
<div class="flex flex-wrap gap-xs mb-lg flex-grow">
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">정신분석</span>
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">심리평가 지도</span>
<span class="bg-surface-container text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-md border border-outline-variant/30">성격장애</span>
</div>
<button class="w-full py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface group-hover:bg-primary-container group-hover:text-on-primary group-hover:border-primary-container transition-all cursor-pointer">
                    프로필 보기
                </button>
</article>
</section>
<!-- Pagination (Simulated) -->
<div class="flex justify-center mt-xl gap-sm">
<button class="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="w-10 h-10 rounded-lg bg-secondary text-on-primary font-label-md text-label-md flex items-center justify-center shadow-sm cursor-pointer">1</button>
<button class="w-10 h-10 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer">2</button>
<button class="w-10 h-10 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer">3</button>
<button class="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div>
</main>
<!-- Footer Shared Component -->
<footer class="bg-surface-container-lowest dark:bg-surface-container-low w-full py-xl px-gutter flex flex-col md:flex-row justify-between items-center gap-md border-t border-outline-variant dark:border-outline flat no shadows mt-auto">
<div class="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2">
            ClinicFlow
        </div>
<div class="flex flex-wrap justify-center gap-md">
<!-- Privacy Policy (Active simulated by underline, though in footer context usually inactive unless explicitly on that page. Following JSON strict execution for generic footer: active state isn't mapped to a specific page here based on intent, but JSON provides style. I will apply inactive to all for a catalog page, as they are not the current page.) -->
<a class="font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Privacy Policy</a>
<a class="font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Terms of Service</a>
<a class="font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Security Standards</a>
<a class="font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Clinical Guidelines</a>
</div>
<div class="font-body-sm text-body-sm text-on-surface dark:text-on-surface">
            © 2024 ClinicFlow Korea. HIPAA &amp; PHI Compliant Architecture.
        </div>
</footer>
</body></html>
```

## supervisor-profile.html

Target route: `/supervisors/[id]`

```html
<!DOCTYPE html>

<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>ClinicFlow - Supervisor Detail</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Hanken+Grotesk:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "error-container": "#ffdad6",
                        "on-tertiary": "#ffffff",
                        "on-surface": "#111c2d",
                        "on-primary-fixed-variant": "#3f465c",
                        "tertiary-fixed-dim": "#c0c7d0",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-highest": "#d8e3fb",
                        "on-tertiary-container": "#7d858d",
                        "inverse-on-surface": "#ecf1ff",
                        "outline-variant": "#c6c6cd",
                        "inverse-primary": "#bec6e0",
                        "secondary": "#0058be",
                        "on-secondary-fixed-variant": "#004395",
                        "on-primary": "#ffffff",
                        "surface": "#f9f9ff",
                        "on-tertiary-fixed-variant": "#40484f",
                        "error": "#ba1a1a",
                        "surface-container-low": "#f0f3ff",
                        "tertiary-container": "#151c23",
                        "surface-tint": "#565e74",
                        "primary-container": "#131b2e",
                        "surface-container-high": "#dee8ff",
                        "secondary-fixed-dim": "#adc6ff",
                        "tertiary-fixed": "#dce3ec",
                        "outline": "#76777d",
                        "on-primary-fixed": "#131b2e",
                        "surface-container": "#e7eeff",
                        "secondary-fixed": "#d8e2ff",
                        "on-secondary-container": "#fefcff",
                        "inverse-surface": "#263143",
                        "surface-variant": "#d8e3fb",
                        "primary": "#000000",
                        "on-secondary-fixed": "#001a42",
                        "primary-fixed": "#dae2fd",
                        "surface-dim": "#cfdaf2",
                        "tertiary": "#000000",
                        "secondary-container": "#2170e4",
                        "on-secondary": "#ffffff",
                        "on-tertiary-fixed": "#151c23",
                        "on-error-container": "#93000a",
                        "on-surface-variant": "#45464d",
                        "on-error": "#ffffff",
                        "on-background": "#111c2d",
                        "on-primary-container": "#7c839b",
                        "surface-bright": "#f9f9ff",
                        "primary-fixed-dim": "#bec6e0",
                        "background": "#f9f9ff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "sm": "12px",
                        "container-max": "1280px",
                        "base": "8px",
                        "gutter": "24px",
                        "md": "16px",
                        "margin-mobile": "16px",
                        "xs": "4px",
                        "xl": "40px",
                        "lg": "24px"
                    },
                    "fontFamily": {
                        "label-md": ["Inter"],
                        "label-sm": ["Inter"],
                        "body-sm": ["Inter"],
                        "headline-lg-mobile": ["Hanken Grotesk"],
                        "body-md": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "headline-lg": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "body-lg": ["Inter"]
                    },
                    "fontSize": {
                        "label-md": ["14px", { "lineHeight": "1", "letterSpacing": "0.01em", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1", "fontWeight": "500" }],
                        "body-sm": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "headline-lg-mobile": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "1.4", "fontWeight": "600" }],
                        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>
<style>
        .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 24px;
        }
    </style>
</head>
<body class="bg-background text-on-surface antialiased min-h-screen flex flex-col">
<!-- Top Navigation Bar -->
<nav class="fixed top-0 w-full z-50 bg-surface dark:bg-inverse-surface px-gutter max-w-container-max mx-auto flex justify-between items-center h-16 border-b border-outline-variant">
<div class="flex items-center gap-gutter">
<span class="font-headline-md text-headline-md font-bold text-primary">ClinicFlow</span>
<div class="hidden md:flex gap-md items-center">
<a class="text-secondary border-b-2 border-secondary pb-1 font-label-md text-label-md cursor-pointer active:opacity-80" href="#">Find Supervisors</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-label-md text-label-md cursor-pointer active:opacity-80" href="#">My Requests</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-label-md text-label-md cursor-pointer active:opacity-80" href="#">Resources</a>
</div>
</div>
<div class="flex items-center gap-md">
<div class="hidden md:flex gap-sm items-center">
<button class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer active:opacity-80 p-sm rounded-full">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">security</span>
</button>
<button class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer active:opacity-80 p-sm rounded-full relative">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
</div>
<button class="bg-primary text-on-primary px-lg py-sm rounded font-label-md text-label-md hover:bg-opacity-90 transition-opacity">
                Secure Login
            </button>
<button class="md:hidden p-sm text-on-surface-variant">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</nav>
<!-- Main Content -->
<main class="flex-grow pt-[88px] pb-xl px-margin-mobile md:px-gutter max-w-container-max mx-auto w-full">
<!-- Breadcrumb / Back Navigation -->
<div class="mb-md">
<button class="flex items-center gap-xs text-secondary hover:underline font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Search Results
            </button>
</div>
<!-- Bento Grid Layout -->
<div class="bento-grid">
<!-- Left Column: Profile Summary & CTA (Sticking on Desktop) -->
<aside class="col-span-12 md:col-span-4 flex flex-col gap-lg">
<div class="glass-card rounded-xl p-lg sticky top-[88px]">
<div class="flex flex-col items-center text-center">
<div class="w-32 h-32 rounded-full overflow-hidden mb-md border-2 border-surface-container-highest">
<img alt="Dr. Kim Profile" class="w-full h-full object-cover" data-alt="A professional headshot of an Asian female doctor or clinical supervisor in a well-lit, modern office setting. She is wearing a dark navy blazer over a light blouse, smiling warmly yet professionally. The background is slightly blurred, showing a clean, corporate environment with soft white lighting and cool tones. The image conveys trust, expertise, and approachability in a clinical context." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2kgvbAc272pObC2Uurq3H3gZ86Hn_VYIbSCGAI0nW0Qos3JPGnIsYbIasJPfzlE2xUHYbmkvg76KVVT39DgGUgj5Py3Bg1xUD3hO74lXL-Y6SwI3cOfWfDlYLH2L7-Ge83iNO3WHR0o5hNY3zwpE02ztzkfu_IiIaNkM6SbEj8eIxkdgmcy8f2uePVoCMLZv4zzgo50_Bg8P1o0Fq0WdOZLDJc_LX4e2V8cKLsOLFrgaARGLZ8WdZP5OSefPT2DjupIwiBB58U-A"/>
</div>
<h1 class="font-headline-md text-headline-md text-primary mb-xs">Dr. Ji-yoon Kim, Ph.D.</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-md">Clinical Psychologist (Level 1) &amp; Board-Certified Supervisor</p>
<div class="flex flex-wrap gap-xs justify-center mb-lg">
<span class="bg-surface-container text-on-primary-fixed px-sm py-xs rounded-full font-label-sm text-label-sm border border-outline-variant">Adult Counseling</span>
<span class="bg-surface-container text-on-primary-fixed px-sm py-xs rounded-full font-label-sm text-label-sm border border-outline-variant">Trauma</span>
<span class="bg-surface-container text-on-primary-fixed px-sm py-xs rounded-full font-label-sm text-label-sm border border-outline-variant">CBT</span>
</div>
<div class="w-full border-t border-outline-variant pt-md mb-lg">
<div class="flex justify-between items-center mb-sm">
<span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[16px]">location_on</span> Seoul, Kangnam
                                </span>
<span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[16px]">video_camera_front</span> Online/Offline
                                </span>
</div>
<div class="flex justify-between items-center">
<span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[16px]">star</span> 4.9 (120+ Reviews)
                                </span>
<span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[16px]">work_history</span> 15+ Yrs Exp.
                                </span>
</div>
</div>
<button class="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-sm">
<span class="material-symbols-outlined">calendar_month</span>
                            의뢰 신청하기 (Request Supervision)
                        </button>
</div>
</div>
</aside>
<!-- Right Column: Detailed Info & Products -->
<div class="col-span-12 md:col-span-8 flex flex-col gap-lg">
<!-- Intro / Bio -->
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant">
<h2 class="font-headline-md text-headline-md text-primary mb-md border-b border-outline-variant pb-xs">소개 (Introduction)</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-md leading-relaxed">
                        안녕하세요. 임상심리전문가 김지윤입니다. 저는 지난 15년간 다양한 임상 현장(대학병원, 지역사회 정신건강복지센터, 사설 상담센터)에서 심리평가와 치료를 수행해왔습니다. 특히 트라우마와 불안 장애 분야에 깊은 전문성을 가지고 있으며, 인지행동치료(CBT) 기반의 구조화된 접근을 선호합니다. 수련생 여러분이 현장에서 겪는 막막함을 함께 고민하고, 독립적인 전문가로 성장할 수 있도록 체계적이고 따뜻한 피드백을 제공하고자 합니다.
                    </p>
</section>
<!-- Academic Background & Career -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant">
<h2 class="font-headline-md text-headline-md text-primary mb-md flex items-center gap-sm">
<span class="material-symbols-outlined">school</span> 학력 및 자격
                        </h2>
<ul class="space-y-sm">
<li class="flex items-start gap-sm">
<span class="material-symbols-outlined text-secondary text-[20px] mt-1">check_circle</span>
<div>
<p class="font-label-md text-label-md">한국심리학회 공인 임상심리전문가</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">자격번호 제1234호 (2010 취득)</p>
</div>
</li>
<li class="flex items-start gap-sm">
<span class="material-symbols-outlined text-secondary text-[20px] mt-1">check_circle</span>
<div>
<p class="font-label-md text-label-md">정신건강임상심리사 1급</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">보건복지부 (2011 취득)</p>
</div>
</li>
<li class="flex items-start gap-sm">
<span class="material-symbols-outlined text-secondary text-[20px] mt-1">school</span>
<div>
<p class="font-label-md text-label-md">한국대학교 대학원 심리학과 임상심리 전공</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">문학박사 (Ph.D.)</p>
</div>
</li>
</ul>
</section>
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant">
<h2 class="font-headline-md text-headline-md text-primary mb-md flex items-center gap-sm">
<span class="material-symbols-outlined">work</span> 주요 경력
                        </h2>
<ul class="space-y-md">
<li class="border-l-2 border-surface-container-highest pl-md ml-xs relative">
<span class="absolute w-3 h-3 bg-secondary rounded-full -left-[7px] top-1"></span>
<p class="font-label-md text-label-md">현) 마인드플로우 심리상담센터 원장</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">2018 - 현재</p>
</li>
<li class="border-l-2 border-surface-container-highest pl-md ml-xs relative">
<span class="absolute w-3 h-3 bg-surface-container-highest rounded-full -left-[7px] top-1"></span>
<p class="font-label-md text-label-md">전) 서울의료원 정신건강의학과 임상심리전문가</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">2012 - 2018</p>
</li>
<li class="border-l-2 border-transparent pl-md ml-xs relative">
<span class="absolute w-3 h-3 bg-surface-container-highest rounded-full -left-[7px] top-1"></span>
<p class="font-label-md text-label-md">전) 한국대학교 학생상담센터 전임상담원</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">2010 - 2012</p>
</li>
</ul>
</section>
</div>
<!-- Supervision Products (Pricing) -->
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant">
<h2 class="font-headline-md text-headline-md text-primary mb-md flex items-center gap-sm">
<span class="material-symbols-outlined">inventory_2</span> 서비스 상품
                    </h2>
<div class="space-y-md">
<!-- Product Card 1 -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-center p-md bg-surface border border-outline-variant rounded-lg hover:border-secondary transition-colors group">
<div class="mb-sm md:mb-0">
<div class="flex items-center gap-sm mb-xs">
<h3 class="font-label-md text-label-md text-primary text-lg">개인 수퍼비전 (심리검사/심리치료)</h3>
<span class="bg-surface-container text-secondary px-2 py-1 rounded text-[10px] font-bold">1:1</span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">50분 진행 / 구조화된 피드백 보고서 제공</p>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-sm">
<span class="font-headline-md text-headline-md text-primary">₩ 100,000</span>
<button class="text-secondary font-label-md text-label-md group-hover:underline">View Slots</button>
</div>
</div>
<!-- Product Card 2 -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-center p-md bg-surface border border-outline-variant rounded-lg hover:border-secondary transition-colors group">
<div class="mb-sm md:mb-0">
<div class="flex items-center gap-sm mb-xs">
<h3 class="font-label-md text-label-md text-primary text-lg">집단 사례 회의 (Case Conference)</h3>
<span class="bg-surface-container text-secondary px-2 py-1 rounded text-[10px] font-bold">Group (Max 5)</span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">90분 진행 / 발표자 1인 + 참관인 다수</p>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-sm">
<span class="font-headline-md text-headline-md text-primary">₩ 150,000 <span class="text-sm font-normal text-on-surface-variant">/발표자</span></span>
<button class="text-secondary font-label-md text-label-md group-hover:underline">View Slots</button>
</div>
</div>
</div>
</section>
<!-- Availability Calendar Preview -->
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant">
<div class="flex justify-between items-center mb-md">
<h2 class="font-headline-md text-headline-md text-primary flex items-center gap-sm">
<span class="material-symbols-outlined">event_available</span> 가능 일정 미리보기
                        </h2>
<div class="flex gap-sm">
<button class="p-xs rounded-md border border-outline-variant hover:bg-surface-container transition-colors"><span class="material-symbols-outlined">chevron_left</span></button>
<button class="p-xs rounded-md border border-outline-variant hover:bg-surface-container transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
</div>
</div>
<!-- Simplified Calendar Grid -->
<div class="grid grid-cols-7 gap-xs text-center mb-md">
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Sun</div>
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Mon</div>
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Tue</div>
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Wed</div>
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Thu</div>
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Fri</div>
<div class="font-label-sm text-label-sm text-on-surface-variant pb-xs">Sat</div>
<!-- Dates (Dummy Data for visual) -->
<div class="p-sm text-on-surface-variant opacity-50 font-body-sm text-body-sm">29</div>
<div class="p-sm text-on-surface-variant opacity-50 font-body-sm text-body-sm">30</div>
<div class="p-sm text-on-surface-variant opacity-50 font-body-sm text-body-sm">31</div>
<div class="p-sm font-body-sm text-body-sm rounded-md border border-transparent hover:border-outline-variant cursor-pointer">1</div>
<div class="p-sm font-body-sm text-body-sm rounded-md border border-secondary text-secondary bg-surface-container cursor-pointer relative"><span class="absolute top-1 right-1 w-1.5 h-1.5 bg-secondary rounded-full"></span>2</div>
<div class="p-sm font-body-sm text-body-sm rounded-md border border-transparent hover:border-outline-variant cursor-pointer">3</div>
<div class="p-sm font-body-sm text-body-sm rounded-md border border-transparent hover:border-outline-variant cursor-pointer">4</div>
</div>
<div class="text-center">
<button class="text-secondary font-label-md text-label-md hover:underline">View Full Calendar</button>
</div>
</section>
</div>
</div>
</main>
<!-- Footer -->
<footer class="w-full py-xl px-gutter flex flex-col md:flex-row justify-between items-center gap-md bg-surface-container-lowest dark:bg-surface-container-low border-t border-outline-variant mt-auto">
<span class="font-headline-sm text-headline-sm font-bold text-primary">ClinicFlow</span>
<div class="flex gap-md font-body-sm text-body-sm">
<a class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Privacy Policy</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Terms of Service</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Security Standards</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" href="#">Clinical Guidelines</a>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant text-center md:text-right">
            © 2024 ClinicFlow Korea. HIPAA &amp; PHI Compliant Architecture.
        </p>
</footer>
</body></html>
```

## new-request.html

Target route: `/requests/new`

```html
<!DOCTYPE html>

<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>새 요청 작성 - ClinicFlow</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "error-container": "#ffdad6",
                        "on-tertiary": "#ffffff",
                        "on-surface": "#111c2d",
                        "on-primary-fixed-variant": "#3f465c",
                        "tertiary-fixed-dim": "#c0c7d0",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-highest": "#d8e3fb",
                        "on-tertiary-container": "#7d858d",
                        "inverse-on-surface": "#ecf1ff",
                        "outline-variant": "#c6c6cd",
                        "inverse-primary": "#bec6e0",
                        "secondary": "#0058be",
                        "on-secondary-fixed-variant": "#004395",
                        "on-primary": "#ffffff",
                        "surface": "#f9f9ff",
                        "on-tertiary-fixed-variant": "#40484f",
                        "error": "#ba1a1a",
                        "surface-container-low": "#f0f3ff",
                        "tertiary-container": "#151c23",
                        "surface-tint": "#565e74",
                        "primary-container": "#131b2e",
                        "surface-container-high": "#dee8ff",
                        "secondary-fixed-dim": "#adc6ff",
                        "tertiary-fixed": "#dce3ec",
                        "outline": "#76777d",
                        "on-primary-fixed": "#131b2e",
                        "surface-container": "#e7eeff",
                        "secondary-fixed": "#d8e2ff",
                        "on-secondary-container": "#fefcff",
                        "inverse-surface": "#263143",
                        "surface-variant": "#d8e3fb",
                        "primary": "#000000",
                        "on-secondary-fixed": "#001a42",
                        "primary-fixed": "#dae2fd",
                        "surface-dim": "#cfdaf2",
                        "tertiary": "#000000",
                        "secondary-container": "#2170e4",
                        "on-secondary": "#ffffff",
                        "on-tertiary-fixed": "#151c23",
                        "on-error-container": "#93000a",
                        "on-surface-variant": "#45464d",
                        "on-error": "#ffffff",
                        "on-background": "#111c2d",
                        "on-primary-container": "#7c839b",
                        "surface-bright": "#f9f9ff",
                        "primary-fixed-dim": "#bec6e0",
                        "background": "#f9f9ff"
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    spacing: {
                        "sm": "12px",
                        "container-max": "1280px",
                        "base": "8px",
                        "gutter": "24px",
                        "md": "16px",
                        "margin-mobile": "16px",
                        "xs": "4px",
                        "xl": "40px",
                        "lg": "24px"
                    },
                    fontFamily: {
                        "label-md": ["Inter"],
                        "label-sm": ["Inter"],
                        "body-sm": ["Inter"],
                        "headline-lg-mobile": ["Hanken Grotesk"],
                        "body-md": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "headline-lg": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "body-lg": ["Inter"]
                    },
                    fontSize: {
                        "label-md": ["14px", { lineHeight: "1", letterSpacing: "0.01em", fontWeight: "600" }],
                        "label-sm": ["12px", { lineHeight: "1", fontWeight: "500" }],
                        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
                        "headline-lg-mobile": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
                        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
                        "headline-md": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
                        "headline-lg": ["32px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
                        "display-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
                        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }]
                    }
                }
            }
        };
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.fill {
            font-variation-settings: 'FILL' 1;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md min-h-screen flex flex-col antialiased">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-surface dark:bg-inverse-surface px-gutter max-w-container-max mx-auto flex justify-between items-center h-16 border-b border-outline-variant dark:border-outline">
<div class="flex items-center gap-lg">
<div class="font-headline-md text-headline-md font-bold text-primary dark:text-inverse-primary cursor-pointer active:opacity-80">ClinicFlow</div>
<nav class="hidden md:flex gap-md">
<a class="text-on-surface-variant dark:text-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors font-label-md text-label-md cursor-pointer active:opacity-80" href="#">Find Supervisors</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors font-label-md text-label-md cursor-pointer active:opacity-80" href="#">My Requests</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-secondary dark:hover:text-secondary-fixed transition-colors font-label-md text-label-md cursor-pointer active:opacity-80" href="#">Resources</a>
</nav>
</div>
<div class="flex items-center gap-md">
<button aria-label="security" class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer active:opacity-80">
<span class="material-symbols-outlined">security</span>
</button>
<button aria-label="notifications" class="text-on-surface-variant hover:text-secondary transition-colors cursor-pointer active:opacity-80">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded font-medium hover:bg-opacity-90 transition-opacity cursor-pointer active:opacity-80">Secure Login</button>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-grow pt-[104px] pb-xl px-gutter md:px-0">
<div class="max-w-container-max mx-auto md:px-gutter">
<!-- Page Header -->
<div class="mb-xl text-center md:text-left">
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-sm">새로운 수퍼비전 요청</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">안전하고 체계적인 임상 수퍼비전을 위한 요청서를 작성합니다. 입력된 모든 정보는 암호화되어 안전하게 보관됩니다.</p>
</div>
<!-- Wizard Layout -->
<div class="flex flex-col lg:flex-row gap-xl">
<!-- Progress Stepper (Left on Desktop, Top on Mobile) -->
<div class="lg:w-1/4 flex-shrink-0">
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-md sticky top-[104px]">
<h2 class="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-wider">진행 단계</h2>
<ul class="space-y-sm">
<li class="flex items-center gap-sm">
<div class="w-8 h-8 rounded-full bg-secondary text-on-primary flex items-center justify-center font-label-md text-label-md">1</div>
<span class="font-label-md text-label-md text-secondary">서비스 선택</span>
</li>
<li class="flex items-center gap-sm opacity-50">
<div class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md border border-outline-variant">2</div>
<span class="font-label-md text-label-md text-on-surface-variant">사례 세부 정보</span>
</li>
<li class="flex items-center gap-sm opacity-50">
<div class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md border border-outline-variant">3</div>
<span class="font-label-md text-label-md text-on-surface-variant">파일 업로드</span>
</li>
<li class="flex items-center gap-sm opacity-50">
<div class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md border border-outline-variant">4</div>
<span class="font-label-md text-label-md text-on-surface-variant">확인 및 결제</span>
</li>
</ul>
</div>
</div>
<!-- Form Area -->
<div class="lg:w-3/4 flex-grow">
<div class="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm">
<div class="p-lg border-b border-outline-variant bg-surface-bright rounded-t-lg flex items-center justify-between">
<div>
<h3 class="font-headline-md text-headline-md text-on-surface">1. 서비스 선택</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">필요한 수퍼비전 유형과 선호하는 방식을 선택해주세요.</p>
</div>
<span class="material-symbols-outlined text-secondary text-[32px] font-light">medical_services</span>
</div>
<div class="p-lg space-y-xl">
<!-- Service Type Selection (Bento-ish Grid) -->
<div>
<label class="block font-label-md text-label-md text-on-surface mb-md">수퍼비전 유형 (택 1)</label>
<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
<label class="relative flex cursor-pointer rounded-lg border bg-surface p-md shadow-sm border-secondary ring-1 ring-secondary">
<input checked="" class="peer sr-only" name="service_type" type="radio" value="individual"/>
<div class="flex w-full items-start justify-between">
<div class="flex items-center gap-sm">
<span class="material-symbols-outlined text-secondary fill">person</span>
<div>
<p class="font-label-md text-label-md text-on-surface">개인 수퍼비전</p>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">1:1 심층 사례 분석 및 지도</p>
</div>
</div>
<div class="h-5 w-5 rounded-full border border-secondary bg-secondary flex items-center justify-center">
<span class="material-symbols-outlined text-on-primary text-[14px]">check</span>
</div>
</div>
</label>
<label class="relative flex cursor-pointer rounded-lg border bg-surface-container-lowest p-md shadow-sm border-outline-variant hover:bg-surface transition-colors">
<input class="peer sr-only" name="service_type" type="radio" value="group"/>
<div class="flex w-full items-start justify-between">
<div class="flex items-center gap-sm">
<span class="material-symbols-outlined text-on-surface-variant">group</span>
<div>
<p class="font-label-md text-label-md text-on-surface">집단 수퍼비전</p>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">다양한 관점을 공유하는 그룹 세션</p>
</div>
</div>
<div class="h-5 w-5 rounded-full border border-outline-variant flex items-center justify-center"></div>
</div>
</label>
</div>
</div>
<!-- Modality Selection -->
<div>
<label class="block font-label-md text-label-md text-on-surface mb-md">진행 방식 선호도</label>
<div class="grid grid-cols-1 sm:grid-cols-3 gap-md">
<button class="border border-outline-variant rounded bg-surface-container-lowest py-sm px-md text-center font-label-md text-label-md text-on-surface hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary" type="button">대면 (Offline)</button>
<button class="border border-secondary bg-inverse-on-surface py-sm px-md text-center font-label-md text-label-md text-secondary rounded focus:outline-none ring-1 ring-secondary" type="button">비대면 화상 (Online)</button>
<button class="border border-outline-variant rounded bg-surface-container-lowest py-sm px-md text-center font-label-md text-label-md text-on-surface hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary" type="button">협의 후 결정</button>
</div>
</div>
<!-- Initial Notes -->
<div>
<label class="block font-label-md text-label-md text-on-surface mb-sm" for="initial_notes">간략한 요청 사유 (선택)</label>
<textarea class="w-full border border-outline-variant rounded bg-surface-container-lowest p-sm font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-shadow resize-none" id="initial_notes" placeholder="수퍼바이저가 미리 알면 좋은 특별한 요청사항이나 맥락을 적어주세요." rows="3"></textarea>
</div>
</div>
<!-- Action Bar -->
<div class="p-lg border-t border-outline-variant bg-surface-bright rounded-b-lg flex justify-end gap-md">
<button class="border border-outline-variant text-on-surface font-label-md text-label-md px-lg py-sm rounded hover:bg-surface-container transition-colors cursor-pointer active:opacity-80" type="button">취소</button>
<button class="bg-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded hover:bg-opacity-90 transition-opacity cursor-pointer active:opacity-80 flex items-center gap-xs" type="button">
                                다음 단계
                                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- Footer -->
<footer class="w-full py-xl px-gutter flex flex-col md:flex-row justify-between items-center gap-md bg-surface-container-lowest dark:bg-surface-container-low border-t border-outline-variant dark:border-outline">
<div class="font-headline-sm text-headline-sm font-bold text-primary">ClinicFlow</div>
<div class="flex gap-md font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface-variant">
<a class="hover:text-secondary transition-colors cursor-pointer" href="#">Privacy Policy</a>
<a class="hover:text-secondary transition-colors cursor-pointer" href="#">Terms of Service</a>
<a class="hover:text-secondary transition-colors cursor-pointer" href="#">Security Standards</a>
<a class="hover:text-secondary transition-colors cursor-pointer" href="#">Clinical Guidelines</a>
</div>
<div class="font-body-sm text-body-sm text-on-surface dark:text-on-surface">© 2024 ClinicFlow Korea. HIPAA &amp; PHI Compliant Architecture.</div>
</footer>
</body></html>
```

## availability-calendar.html

Target route: `/supervisor/availability and public booking slots`

```html
<!DOCTYPE html>

<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>일정 관리 - Supervision Pro</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary-fixed-variant": "#004395",
                        "surface-container-low": "#f0f3ff",
                        "on-tertiary": "#ffffff",
                        "surface-container-high": "#dee8ff",
                        "surface": "#f9f9ff",
                        "secondary": "#0058be",
                        "inverse-surface": "#263143",
                        "error": "#ba1a1a",
                        "on-error": "#ffffff",
                        "surface-variant": "#d8e3fb",
                        "surface-container-highest": "#d8e3fb",
                        "tertiary-fixed-dim": "#c0c7d0",
                        "on-tertiary-fixed-variant": "#40484f",
                        "on-background": "#111c2d",
                        "on-primary-container": "#7c839b",
                        "surface-tint": "#565e74",
                        "tertiary": "#000000",
                        "on-surface": "#111c2d",
                        "inverse-primary": "#bec6e0",
                        "surface-bright": "#f9f9ff",
                        "on-primary-fixed": "#131b2e",
                        "surface-dim": "#cfdaf2",
                        "secondary-fixed-dim": "#adc6ff",
                        "primary-container": "#131b2e",
                        "secondary-fixed": "#d8e2ff",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed": "#001a42",
                        "on-primary": "#ffffff",
                        "primary": "#000000",
                        "on-surface-variant": "#45464d",
                        "on-tertiary-container": "#7d858d",
                        "on-tertiary-fixed": "#151c23",
                        "background": "#f9f9ff",
                        "tertiary-fixed": "#dce3ec",
                        "outline-variant": "#c6c6cd",
                        "surface-container-lowest": "#ffffff",
                        "outline": "#76777d",
                        "on-secondary-container": "#fefcff",
                        "tertiary-container": "#151c23",
                        "on-secondary": "#ffffff",
                        "surface-container": "#e7eeff",
                        "inverse-on-surface": "#ecf1ff",
                        "secondary-container": "#2170e4",
                        "on-error-container": "#93000a",
                        "primary-fixed": "#dae2fd",
                        "on-primary-fixed-variant": "#3f465c",
                        "primary-fixed-dim": "#bec6e0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "margin-mobile": "16px",
                        "xs": "4px",
                        "gutter": "24px",
                        "md": "16px",
                        "lg": "24px",
                        "base": "8px",
                        "sm": "12px",
                        "xl": "40px",
                        "container-max": "1280px"
                    },
                    "fontFamily": {
                        "body-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-lg-mobile": ["Hanken Grotesk"],
                        "body-sm": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "label-sm": ["Inter"],
                        "headline-lg": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "label-md": ["Inter"]
                    },
                    "fontSize": {
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-lg-mobile": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "body-sm": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "1.4", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1", "fontWeight": "500" }],
                        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "1", "letterSpacing": "0.01em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        /* Custom scrollbar for calendar grid */
        .calendar-scroll::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .calendar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .calendar-scroll::-webkit-scrollbar-thumb {
            background-color: #c6c6cd;
            border-radius: 10px;
        }
        .slot-btn {
            transition: all 0.2s ease-in-out;
        }
        .slot-available {
            background-color: #2170e4; /* secondary-container */
            color: #ffffff; /* on-secondary */
            border-color: #2170e4;
        }
        .slot-empty {
            background-color: #ffffff;
            color: #45464d;
            border-color: #c6c6cd;
            border-style: dashed;
        }
        .slot-empty:hover {
            background-color: #f0f3ff;
            border-color: #0058be;
            border-style: solid;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md antialiased flex flex-col min-h-screen">
<!-- TopAppBar -->
<header class="bg-surface-container-lowest border-b border-outline-variant flat no shadows fixed docked full-width top-0 z-50 h-16 w-full flex justify-between items-center px-lg max-w-container-max mx-auto">
<div class="flex items-center gap-sm cursor-pointer active:opacity-80 transition-opacity">
<span class="font-headline-md text-headline-md font-bold text-primary">Supervision Pro</span>
</div>
<div class="flex items-center gap-md">
<button class="p-xs rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="p-xs rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="help">help</span>
</button>
<div class="w-8 h-8 rounded-full bg-surface-dim overflow-hidden border border-outline-variant cursor-pointer ml-sm">
<img alt="Supervisor Profile" class="w-full h-full object-cover" data-alt="A professional headshot of a middle-aged Asian clinical supervisor, wearing business casual attire, well-lit studio photography, soft neutral background, conveying trust and medical expertise." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDByzpgsg-yXsQaIE_AxICw6GRw7ih1W4aLrkIxdHcZj3DmooeHonBjH1V1M04yMiPRwlPuz86u4pf2L9F60AID_9hGF8iCsDoTkS9Tg01IFODnU_LRzZhSbDtiOYKpMlWGwE_R1Ptx1NFs8yIOvzyt_x4O0QFMQmYhqJqdmYsfjDqKma7M0L_FgSk4j1k18I-MljXGGHfKDfZoqEIE9vJN6BAM1Pp2NEn54edN4dP46ByE0Nj_YbRohIz5e2GCvjyhqhjhtpMg-E"/>
</div>
</div>
</header>
<div class="flex flex-1 pt-16">
<!-- SideNavBar (Desktop) -->
<aside class="hidden md:flex flex-col h-[calc(100vh-64px)] fixed left-0 w-64 p-md border-r border-outline-variant bg-surface z-40">
<div class="mb-lg px-sm">
<div class="flex items-center gap-sm mb-xs">
<div class="w-10 h-10 rounded-full bg-surface-dim overflow-hidden border border-outline-variant">
<img alt="Supervisor Avatar" class="w-full h-full object-cover" data-alt="A professional headshot of a middle-aged Asian clinical supervisor, wearing business casual attire, well-lit studio photography, soft neutral background, conveying trust and medical expertise." src="https://lh3.googleusercontent.com/aida-public/AB6AXuALILOawBk_XJZYBYLYEfCquxXz8QEoc_Iv_QtCv33pJoIKzlvkiqLC55hdUuS62Rhl2aFsrCVLrdbIWD6SpfvD6-8OGPsm1Dfylk0KxL32ipghdu3nTu89rvmOGRcmi0ySUExmZw5FY6gMD4ycFulBT2moen3Z5_6yMMO-b9tRSNkX0nVGRHk-MceIIFvycyE23HOekSJ-XXLVbRl51xKQ5o3sUlrRtWkv-JxVznNWPZcbefkridOtFv8TvqH_5iHxDXI8V6E-Jck"/>
</div>
<div>
<h2 class="font-label-md text-label-md text-on-background">Dr. Kim, PhD</h2>
<p class="font-label-sm text-label-sm text-on-surface-variant">Clinical Supervisor</p>
</div>
</div>
</div>
<nav class="flex-1 space-y-xs">
<a class="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-label-md text-label-md">Dashboard</span>
</a>
<a class="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="clinical_notes">clinical_notes</span>
<span class="font-label-md text-label-md">Case Review</span>
</a>
<a class="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="badge">badge</span>
<span class="font-label-md text-label-md">Profile</span>
</a>
<a class="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
<span class="font-label-md text-label-md">Services</span>
</a>
<!-- Active Nav Item -->
<a class="flex items-center gap-sm px-sm py-sm bg-secondary-container text-on-secondary-container font-bold rounded-lg transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="calendar_month" data-weight="fill" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
<span class="font-label-md text-label-md">Schedule</span>
</a>
</nav>
<div class="mt-auto space-y-xs pt-md border-t border-surface-container-high">
<a class="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</a>
<a class="flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container transition-all scale-98 active:scale-95" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
<span class="font-label-md text-label-md">Sign Out</span>
</a>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 md:ml-64 p-margin-mobile md:p-gutter max-w-container-max w-full mx-auto pb-24 md:pb-gutter">
<!-- Page Header -->
<div class="mb-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
<div>
<h1 class="font-headline-lg text-headline-lg md:text-display-lg md:font-display-lg text-on-background">일정 및 예약 관리</h1>
<p class="font-body-md text-body-md text-on-surface-variant mt-base">슈퍼비전 세션이 가능한 요일과 시간을 설정하세요.</p>
</div>
<div class="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-full p-xs">
<button class="p-xs rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors">
<span class="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
</button>
<span class="font-label-md text-label-md px-sm">2023년 10월 넷째 주</span>
<button class="p-xs rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors">
<span class="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 xl:grid-cols-12 gap-lg">
<!-- Main Calendar View (Span 8) -->
<div class="xl:col-span-8 space-y-md">
<div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex flex-col h-full">
<!-- Calendar Header/Legend -->
<div class="flex justify-between items-center p-md border-b border-outline-variant bg-surface-bright">
<h3 class="font-label-md text-label-md text-on-background">주간 예약 슬롯</h3>
<div class="flex items-center gap-md font-label-sm text-label-sm text-on-surface-variant">
<div class="flex items-center gap-xs">
<div class="w-3 h-3 rounded-full border border-dashed border-outline-variant bg-surface-container-lowest"></div>
<span>비어있음</span>
</div>
<div class="flex items-center gap-xs">
<div class="w-3 h-3 rounded-full bg-secondary-container"></div>
<span>예약 가능</span>
</div>
<div class="flex items-center gap-xs">
<div class="w-3 h-3 rounded-full bg-surface-dim"></div>
<span>예약 완료</span>
</div>
</div>
</div>
<!-- Grid -->
<div class="p-md overflow-x-auto calendar-scroll">
<div class="min-w-[600px] grid grid-cols-8 gap-xs">
<!-- Time Column -->
<div class="flex flex-col gap-sm pt-8 text-right pr-sm text-on-surface-variant font-label-sm text-label-sm">
<div class="h-10 flex items-center justify-end">13:00</div>
<div class="h-10 flex items-center justify-end">14:00</div>
<div class="h-10 flex items-center justify-end">15:00</div>
<div class="h-10 flex items-center justify-end">16:00</div>
<div class="h-10 flex items-center justify-end">17:00</div>
</div>
<!-- Day Columns -->
<!-- Mon -->
<div class="flex flex-col gap-sm">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-on-background">월</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/23</div>
</div>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
<div class="h-10 w-full rounded bg-surface-dim border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant cursor-not-allowed opacity-80" title="예약 완료 (김서연 선생님)">예약됨</div>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
</div>
<!-- Tue -->
<div class="flex flex-col gap-sm">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-on-background">화</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/24</div>
</div>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<div class="h-10 w-full rounded bg-surface-dim border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant cursor-not-allowed opacity-80" title="예약 완료 (이준호 선생님)">예약됨</div>
</div>
<!-- Wed -->
<div class="flex flex-col gap-sm">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-on-background">수</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/25</div>
</div>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
</div>
<!-- Thu, Fri, Sat, Sun Follow similar pattern, abbreviated for structural clarity -->
<!-- Thu -->
<div class="flex flex-col gap-sm">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-on-background">목</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/26</div>
</div>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<div class="h-10 w-full rounded bg-surface-dim border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant cursor-not-allowed opacity-80" title="예약 완료 (박지민 선생님)">예약됨</div>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
</div>
<!-- Fri -->
<div class="flex flex-col gap-sm">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-on-background">금</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/27</div>
</div>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
<button class="slot-btn slot-available h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm shadow-sm" onclick="toggleSlot(this)">가능</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
<button class="slot-btn slot-empty h-10 w-full rounded border flex items-center justify-center font-label-sm text-label-sm" onclick="toggleSlot(this)">+ 추가</button>
</div>
<!-- Sat -->
<div class="flex flex-col gap-sm opacity-50">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-on-background">토</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/28</div>
</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
</div>
<!-- Sun -->
<div class="flex flex-col gap-sm opacity-50">
<div class="text-center pb-sm border-b border-outline-variant mb-xs">
<div class="font-label-md text-label-md text-error">일</div>
<div class="font-body-sm text-body-sm text-on-surface-variant">10/29</div>
</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
<div class="h-10 w-full rounded border-dashed border border-outline-variant flex items-center justify-center font-label-sm text-label-sm text-outline">휴무</div>
</div>
</div>
</div>
</div>
</div>
<!-- Settings & Integrations (Span 4) -->
<div class="xl:col-span-4 space-y-md">
<!-- Integration Card -->
<div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-md">
<h3 class="font-label-md text-label-md text-on-background mb-sm">외부 캘린더 연동</h3>
<div class="flex items-center justify-between bg-surface p-sm rounded-lg border border-outline-variant">
<div class="flex items-center gap-sm">
<span class="material-symbols-outlined text-secondary" data-icon="calendar_today">calendar_today</span>
<div>
<p class="font-label-md text-label-md text-on-background">Google 캘린더</p>
<p class="font-label-sm text-label-sm text-secondary flex items-center gap-xs">
<span class="w-2 h-2 rounded-full bg-secondary block"></span> 연동됨
                                    </p>
</div>
</div>
<button class="text-label-sm font-label-sm text-on-surface-variant hover:text-on-background transition-colors">
                                관리
                            </button>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-sm">
                            개인 일정이 있는 시간대는 자동으로 '예약 불가' 처리됩니다.
                        </p>
</div>
<!-- Bulk Update Card -->
<div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-col gap-md">
<h3 class="font-label-md text-label-md text-on-background">반복 일정 설정</h3>
<div class="space-y-sm">
<label class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-on-surface-variant">적용 기간</span>
<select class="bg-surface border border-outline-variant rounded-lg p-sm font-body-sm text-on-background focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all">
<option>향후 4주간</option>
<option>이번 학기 전체</option>
<option>사용자 지정...</option>
</select>
</label>
<label class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-on-surface-variant">기본 요일 설정</span>
<div class="flex gap-xs flex-wrap">
<button class="px-sm py-xs rounded-full border border-secondary bg-secondary-container text-on-secondary-container font-label-sm">월</button>
<button class="px-sm py-xs rounded-full border border-secondary bg-secondary-container text-on-secondary-container font-label-sm">화</button>
<button class="px-sm py-xs rounded-full border border-outline-variant text-on-surface-variant font-label-sm">수</button>
<button class="px-sm py-xs rounded-full border border-outline-variant text-on-surface-variant font-label-sm">목</button>
<button class="px-sm py-xs rounded-full border border-secondary bg-secondary-container text-on-secondary-container font-label-sm">금</button>
</div>
</label>
</div>
<button class="w-full bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg hover:opacity-90 transition-opacity mt-sm">
                            일괄 적용 저장
                        </button>
</div>
</div>
</div>
</main>
</div>
<!-- BottomNavBar (Mobile) -->
<nav class="bg-surface-container-lowest border-t border-outline-variant shadow-lg docked full-width bottom-0 rounded-t-xl fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-margin-mobile py-2 md:hidden">
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container transition-colors rounded-full active:scale-95 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="home">home</span>
<span class="font-label-sm text-label-sm mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container transition-colors rounded-full active:scale-95 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="rate_review">rate_review</span>
<span class="font-label-sm text-label-sm mt-1">Review</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container transition-colors rounded-full active:scale-95 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="inventory_2">inventory_2</span>
<span class="font-label-sm text-label-sm mt-1">Products</span>
</a>
<!-- Assuming Profile acts as settings container on mobile -->
<a class="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-95 transition-transform duration-150" href="#">
<span class="material-symbols-outlined" data-icon="person" data-weight="fill" style="font-variation-settings: 'FILL' 1;">person</span>
<span class="font-label-sm text-label-sm mt-1 font-bold">Profile</span>
</a>
</nav>
<script>
        // Simple vanilla JS to demonstrate interactivity of slot toggling
        function toggleSlot(button) {
            if (button.classList.contains('slot-empty')) {
                button.classList.remove('slot-empty');
                button.classList.add('slot-available');
                button.classList.add('shadow-sm');
                button.innerText = '가능';
            } else if (button.classList.contains('slot-available')) {
                button.classList.remove('slot-available');
                button.classList.remove('shadow-sm');
                button.classList.add('slot-empty');
                button.innerText = '+ 추가';
            }
        }
    </script>
</body></html>
```

## work-surface.html

Target route: `/supervisor/requests/[id]`

```html
<!DOCTYPE html>

<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>사례 검토 워크스페이스 - Supervision Pro</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Hanken+Grotesk:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary-fixed-variant": "#004395",
                        "surface-container-low": "#f0f3ff",
                        "on-tertiary": "#ffffff",
                        "surface-container-high": "#dee8ff",
                        "surface": "#f9f9ff",
                        "secondary": "#0058be",
                        "inverse-surface": "#263143",
                        "error": "#ba1a1a",
                        "on-error": "#ffffff",
                        "surface-variant": "#d8e3fb",
                        "surface-container-highest": "#d8e3fb",
                        "tertiary-fixed-dim": "#c0c7d0",
                        "on-tertiary-fixed-variant": "#40484f",
                        "on-background": "#111c2d",
                        "on-primary-container": "#7c839b",
                        "surface-tint": "#565e74",
                        "tertiary": "#000000",
                        "on-surface": "#111c2d",
                        "inverse-primary": "#bec6e0",
                        "surface-bright": "#f9f9ff",
                        "on-primary-fixed": "#131b2e",
                        "surface-dim": "#cfdaf2",
                        "secondary-fixed-dim": "#adc6ff",
                        "primary-container": "#131b2e",
                        "secondary-fixed": "#d8e2ff",
                        "error-container": "#ffdad6",
                        "on-secondary-fixed": "#001a42",
                        "on-primary": "#ffffff",
                        "primary": "#000000",
                        "on-surface-variant": "#45464d",
                        "on-tertiary-container": "#7d858d",
                        "on-tertiary-fixed": "#151c23",
                        "background": "#f9f9ff",
                        "tertiary-fixed": "#dce3ec",
                        "outline-variant": "#c6c6cd",
                        "surface-container-lowest": "#ffffff",
                        "outline": "#76777d",
                        "on-secondary-container": "#fefcff",
                        "tertiary-container": "#151c23",
                        "on-secondary": "#ffffff",
                        "surface-container": "#e7eeff",
                        "inverse-on-surface": "#ecf1ff",
                        "secondary-container": "#2170e4",
                        "on-error-container": "#93000a",
                        "primary-fixed": "#dae2fd",
                        "on-primary-fixed-variant": "#3f465c",
                        "primary-fixed-dim": "#bec6e0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "margin-mobile": "16px",
                        "xs": "4px",
                        "gutter": "24px",
                        "md": "16px",
                        "lg": "24px",
                        "base": "8px",
                        "sm": "12px",
                        "xl": "40px",
                        "container-max": "1280px"
                    },
                    "fontFamily": {
                        "body-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-lg-mobile": ["Hanken Grotesk"],
                        "body-sm": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "label-sm": ["Inter"],
                        "headline-lg": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "label-md": ["Inter"]
                    },
                    "fontSize": {
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-lg-mobile": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "body-sm": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "1.4", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1", "fontWeight": "500" }],
                        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "1", "letterSpacing": "0.01em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-filled {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .pattern-bg {
            background-image: radial-gradient(var(--tw-colors-outline-variant) 1px, transparent 1px);
            background-size: 16px 16px;
            background-position: -8px -8px;
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen font-body-md antialiased selection:bg-secondary-container selection:text-on-secondary-container">
<header class="bg-surface-container-lowest dark:bg-primary-container border-b border-outline-variant dark:border-outline docked full-width top-0 sticky z-50">
<div class="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-16">
<div class="flex items-center gap-md">
<div class="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">Supervision Pro</div>
</div>
<div class="flex items-center gap-md text-on-surface-variant dark:text-surface-variant">
<button class="hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors cursor-pointer active:opacity-80 transition-opacity p-2 rounded-full flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors cursor-pointer active:opacity-80 transition-opacity p-2 rounded-full flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="help">help</span>
</button>
<div class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden cursor-pointer ml-2">
<img alt="Supervisor Profile" class="w-full h-full object-cover" data-alt="A professional headshot of a clinical supervisor, neutral expression, soft studio lighting, modern minimalist background, conveying trust and medical authority." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIdD5tDQPT5erTCI030N6xhVd-fm38Lmbf-nJYO5evkjbAgl1GQkSOdzzE7jT0COj_EjnFruFxGcfnLkFrhyTWs1_9-x0dmyqoWqJnfLEuk4H6eD3RgndhXIvxyeJhcbEornlnKb_AxUeG-XY-eYtuDLJuT7UQ781957CSG1hh1HnjzMtQM-rkClt_qWozMCKT2KYmOipkKYYJcuI_whr49AN18890M-nNuQlThmFa05EDoj9UOVlXmfKSuzv5WBYmGGjFM_bt388"/>
</div>
</div>
</div>
</header>
<div class="bg-surface border-b border-outline-variant sticky top-16 z-40 bg-opacity-90 backdrop-blur-md">
<div class="max-w-container-max mx-auto px-gutter py-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
<div class="flex items-center gap-sm">
<button class="text-on-surface-variant hover:text-on-surface flex items-center gap-xs font-label-md text-label-md transition-colors">
<span class="material-symbols-outlined text-[18px]">arrow_back</span>
                    목록으로
                </button>
<div class="w-[1px] h-4 bg-outline-variant mx-2"></div>
<h1 class="font-headline-md text-headline-md text-on-surface m-0">REQ-2023-11-042</h1>
<span class="bg-surface-container-high text-on-surface px-2 py-1 rounded-full font-label-sm text-label-sm ml-2 border border-outline-variant">검토 진행중</span>
</div>
<div class="flex items-center gap-sm w-full sm:w-auto">
<button class="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-outline font-label-md text-label-md text-on-surface hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-xs">
<span class="material-symbols-outlined text-[18px]">edit_note</span>
                    보완 요청
                </button>
<button class="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs shadow-sm">
<span class="material-symbols-outlined text-[18px]">check_circle</span>
                    승인 및 완료
                </button>
</div>
</div>
</div>
<main class="max-w-container-max mx-auto px-gutter py-lg grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
<aside class="col-span-1 lg:col-span-3 flex flex-col gap-gutter">
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col relative">
<div class="bg-surface-container px-md py-sm border-b border-outline-variant flex items-center gap-xs relative z-10">
<span class="material-symbols-outlined text-secondary icon-filled text-[18px]">shield_locked</span>
<span class="font-label-md text-label-md text-secondary">보안 영역: PHI 비식별화 확인</span>
</div>
<div class="p-md flex flex-col gap-md pattern-bg relative z-0">
<div class="bg-surface-container-lowest bg-opacity-90 backdrop-blur-sm p-sm rounded-lg border border-outline-variant">
<div class="grid grid-cols-2 gap-sm">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface-variant mb-xs">환자 ID</span>
<span class="font-body-sm text-body-sm text-on-surface font-medium">PT-8921-A</span>
</div>
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface-variant mb-xs">연령/성별</span>
<span class="font-body-sm text-body-sm text-on-surface font-medium">28 / F</span>
</div>
<div class="flex flex-col col-span-2">
<span class="font-label-sm text-label-sm text-on-surface-variant mb-xs">주호소 (CC)</span>
<span class="font-body-sm text-body-sm text-on-surface">반복적인 우울감 및 대인관계 불안</span>
</div>
<div class="flex flex-col col-span-2">
<span class="font-label-sm text-label-sm text-on-surface-variant mb-xs">회기 수</span>
<span class="font-body-sm text-body-sm text-on-surface">12회기 중 4회기</span>
</div>
</div>
</div>
</div>
</div>
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
<h3 class="font-label-md text-label-md text-on-surface mb-md flex items-center gap-xs">
<span class="material-symbols-outlined text-[18px] text-on-surface-variant">folder_open</span>
                    사례 패킷 (첨부파일)
                </h3>
<ul class="flex flex-col gap-sm">
<li class="flex items-center justify-between p-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer group">
<div class="flex items-center gap-sm">
<div class="w-8 h-8 rounded bg-error-container text-on-error-container flex items-center justify-center">
<span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
</div>
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface">사례보고서_PT8921.pdf</span>
<span class="font-label-sm text-label-sm text-on-surface-variant text-[10px]">2.4 MB</span>
</div>
</div>
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-secondary text-[18px]">download</span>
</li>
<li class="flex items-center justify-between p-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer group">
<div class="flex items-center gap-sm">
<div class="w-8 h-8 rounded bg-surface-container-high text-on-surface flex items-center justify-center">
<span class="material-symbols-outlined text-[16px]">description</span>
</div>
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface">4회기_축어록.docx</span>
<span class="font-label-sm text-label-sm text-on-surface-variant text-[10px]">842 KB</span>
</div>
</div>
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-secondary text-[18px]">download</span>
</li>
</ul>
</div>
</aside>
<section class="col-span-1 lg:col-span-6 flex flex-col h-full min-h-[600px]">
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col flex-grow overflow-hidden">
<div class="bg-surface border-b border-outline-variant px-md py-sm flex justify-between items-center">
<div class="flex gap-sm">
<button class="bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors border border-transparent">
                            지도 의견 작성
                        </button>
<button class="bg-transparent text-on-surface-variant hover:bg-surface-container-high px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors border border-transparent">
                            내부 메모 (비공개)
                        </button>
</div>
<button class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px]">magic_button</span>
                        임상 템플릿
                    </button>
</div>
<div class="border-b border-outline-variant bg-surface-container-lowest px-sm py-2 flex items-center gap-2 overflow-x-auto">
<button class="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">format_bold</span></button>
<button class="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">format_italic</span></button>
<button class="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">format_underlined</span></button>
<div class="w-[1px] h-4 bg-outline-variant mx-1"></div>
<button class="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
<button class="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
<div class="w-[1px] h-4 bg-outline-variant mx-1"></div>
<button class="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">psychology</span></button>
</div>
<div class="flex-grow p-md relative">
<textarea class="w-full h-full resize-none bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none border-none p-0 focus:ring-0" placeholder="수련생을 위한 지도 의견을 작성해주세요. 임상적 개입의 타당성, 전이/역전이 이슈, 향후 치료 계획에 대한 제언을 포함하는 것을 권장합니다."></textarea>
</div>
<div class="bg-surface px-md py-sm border-t border-outline-variant flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span>마지막 자동 저장: 방금 전</span>
<span>0 자</span>
</div>
</div>
</section>
<aside class="col-span-1 lg:col-span-3">
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
<h3 class="font-label-md text-label-md text-on-surface mb-md flex items-center gap-xs">
<span class="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>
                    검토 이력
                </h3>
<div class="relative pl-4 border-l border-outline-variant space-y-lg ml-2">
<div class="relative">
<div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface-container-lowest"></div>
<div class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-secondary">현재 상태</span>
<span class="font-body-sm text-body-sm text-on-surface font-medium">검토 진행중</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">2023.11.04 14:30 - Dr. Kim</span>
</div>
</div>
<div class="relative">
<div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface-container-high border border-outline-variant ring-4 ring-surface-container-lowest"></div>
<div class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-on-surface-variant">이전 상태</span>
<span class="font-body-sm text-body-sm text-on-surface">지도 요청 접수</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">2023.11.03 09:15 - 시스템</span>
</div>
</div>
<div class="relative">
<div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface-container-high border border-outline-variant ring-4 ring-surface-container-lowest"></div>
<div class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-on-surface-variant">이전 상태</span>
<span class="font-body-sm text-body-sm text-on-surface">PHI 비식별화 완료</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">2023.11.03 09:14 - 시스템 자동화</span>
</div>
</div>
</div>
</div>
</aside>
</main>
</body></html>
```

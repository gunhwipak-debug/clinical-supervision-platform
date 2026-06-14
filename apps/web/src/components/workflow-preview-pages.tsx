import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  MessageSquareText,
  Upload
} from "lucide-react";
import { AppShell } from "./app-shell";
import {
  FlowStepNav,
  PrimaryActionPanel,
  SectionBlock,
  SiteHeader
} from "./clinicflow-shell";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const flowSteps = [
  "슈퍼바이저 선택",
  "세션 선택",
  "자료 제출",
  "슈퍼비전",
  "피드백",
  "학습 기록"
];

export function PreviewNotice() {
  return (
    <div className="rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
      로그인 전에는 흐름을 먼저 볼 수 있도록 예시 화면을 보여드립니다. 로그인
      후에는 실제 의뢰와 기록이 표시됩니다.
    </div>
  );
}

export function DemoRequestsPreview() {
  return (
    <AppShell
      active="requests"
      title="내 의뢰"
      subtitle="진행 중인 슈퍼비전과 다음에 해야 할 일을 먼저 확인합니다."
      action={
        <Button asChild>
          <Link href="/supervisors">새 슈퍼비전 시작</Link>
        </Button>
      }
    >
      <PreviewNotice />
      <PrimaryActionPanel
        title="추가 자료를 제출하면 검토가 이어집니다"
        action={
          <Button asChild variant="secondary">
            <Link href="/requests/demo-additional-info">자료 제출</Link>
          </Button>
        }
      >
        이민서 슈퍼바이저가 검사 원자료와 보호자 면담 요약을 요청했습니다.
      </PrimaryActionPanel>
      <div className="grid gap-4">
        {[
          ["추가 자료 요청됨", "종합심리평가 보고서", "검사 원자료와 면담 요약을 보완하세요.", "자료 제출"],
          ["검토 진행 중", "초기 상담 구조화", "피드백 초안이 작성되고 있습니다.", "진행 확인"],
          ["이수 기록 발급됨", "위기 사례 의사소통", "완료 기록과 피드백을 확인할 수 있습니다.", "기록 보기"]
        ].map(([status, title, body, action]) => (
          <Card
            className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center"
            key={title}
          >
            <div>
              <Badge tone={status === "추가 자료 요청됨" ? "accent" : "neutral"}>
                {status}
              </Badge>
              <h2 className="mt-3 text-xl font-bold text-ink-900">{title}</h2>
              <p className="mt-2 text-sm text-ink-600">{body}</p>
            </div>
            <Button asChild variant={status === "추가 자료 요청됨" ? "primary" : "secondary"}>
              <Link href="/requests/demo-additional-info">{action}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function DemoNewRequestPreview() {
  return (
    <AppShell
      active="requests"
      title="새 슈퍼비전 의뢰"
      subtitle="슈퍼바이저, 세션, 일정, 자료를 순서대로 선택합니다."
      action={
        <Button asChild>
          <a href="#case-material">자료 제출로 이동</a>
        </Button>
      }
    >
      <PreviewNotice />
      <FlowStepNav current="자료 제출" steps={flowSteps} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-4">
          {[
            ["1. 슈퍼바이저", "이민서 슈퍼바이저 · 종합심리평가, 아동·청소년"],
            ["2. 세션", "사례 개념화 50분 · 120,000원"],
            ["3. 일정", "6월 18일 목요일 19:00"],
            ["4. 사례 자료", "주호소, 의뢰 사유, 검사 자료, 질문을 작성합니다."]
          ].map(([title, body], index) => (
            <Card
              className={index === 3 ? "border-brand-200 bg-brand-50" : ""}
              key={title}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink-900">{title}</h2>
                  <p className="mt-2 text-sm text-ink-600">{body}</p>
                </div>
                <Badge tone={index === 3 ? "accent" : "brand"}>
                  {index === 3 ? "작성 중" : "완료"}
                </Badge>
              </div>
            </Card>
          ))}
          <Card id="case-material" className="grid gap-5">
            <div>
              <Badge tone="accent">자료 제출</Badge>
              <h2 className="mt-3 text-2xl font-bold text-ink-900">
                슈퍼바이저가 검토할 자료를 올립니다
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                개인정보를 제외한 사례 요약, 검사 결과, 질문을 한곳에 정리합니다.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InputPreview label="주호소" value="또래 관계 갈등과 등교 거부가 반복됩니다." />
              <InputPreview label="의뢰 목적" value="검사 결과 해석과 부모 상담 방향을 점검하고 싶습니다." />
              <InputPreview label="사용 검사" value="K-WISC-V, SCT, CBCL" />
              <InputPreview label="희망 피드백" value="진단 가설, 보완 자료, 상담 우선순위" />
            </div>
            <div className="grid place-items-center gap-3 rounded-md border border-dashed border-brand-200 bg-surface-base p-8 text-center">
              <Upload aria-hidden className="text-brand-600" size={28} />
              <p className="font-bold text-ink-900">PDF, 문서, 이미지 파일을 추가</p>
              <p className="text-sm text-ink-500">
                기존 자료 업로드 흐름은 이 단계에 유지됩니다.
              </p>
            </div>
          </Card>
        </section>
        <aside className="grid content-start gap-4">
          <Card>
            <h2 className="text-lg font-bold text-ink-900">선택 요약</h2>
            <SummaryRows
              rows={[
                ["슈퍼바이저", "이민서"],
                ["세션", "사례 개념화 50분"],
                ["일정", "6월 18일 19:00"],
                ["다음 단계", "최종 확인 후 결제"]
              ]}
            />
          </Card>
          <Button asChild size="lg">
            <Link href="/requests/demo-additional-info">의뢰 초안 저장</Link>
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}

export function DemoRequestDetailPreview() {
  return (
    <AppShell
      active="requests"
      title="의뢰 상세"
      subtitle="현재 상태, 제출 자료, 피드백 요청을 한 화면에서 확인합니다."
      action={
        <Button asChild>
          <Link href="#upload">추가 자료 제출</Link>
        </Button>
      }
    >
      <PreviewNotice />
      <FlowStepNav current="자료 제출" steps={flowSteps} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-5">
          <PrimaryActionPanel title="지금 해야 할 일">
            슈퍼바이저가 보호자 면담 요약과 검사 원자료를 추가로 요청했습니다.
          </PrimaryActionPanel>
          <Card id="upload" className="grid gap-4">
            <div className="flex items-start gap-3">
              <FileText aria-hidden className="text-brand-600" />
              <div>
                <h2 className="text-xl font-bold text-ink-900">제출 자료</h2>
                <p className="mt-1 text-sm text-ink-600">
                  기존 업로드 자료와 추가 요청 자료를 구분해 관리합니다.
                </p>
              </div>
            </div>
            {[
              ["사례요약 1건", "제출 완료"],
              ["검사결과 PDF 2건", "제출 완료"],
              ["보호자 면담 요약", "추가 필요"]
            ].map(([title, status]) => (
              <div
                className="flex items-center justify-between rounded-md border border-line bg-surface-base px-4 py-3"
                key={title}
              >
                <span className="font-semibold text-ink-900">{title}</span>
                <Badge tone={status === "추가 필요" ? "accent" : "brand"}>{status}</Badge>
              </div>
            ))}
          </Card>
          <Card>
            <h2 className="text-xl font-bold text-ink-900">최근 피드백</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              진단 가설은 유지하되, 면담 기록을 보완한 뒤 개입 우선순위를 다시
              정리해 주세요.
            </p>
          </Card>
        </section>
        <Card className="h-fit">
          <h2 className="text-lg font-bold text-ink-900">의뢰 요약</h2>
          <SummaryRows
            rows={[
              ["상태", "추가 자료 요청됨"],
              ["슈퍼바이저", "이민서"],
              ["세션", "사례 개념화 50분"],
              ["일정", "6월 18일 19:00"]
            ]}
          />
        </Card>
      </div>
    </AppShell>
  );
}

export function DemoPaymentsPreview() {
  return (
    <AppShell
      active="payments"
      title="결제 내역"
      subtitle="무엇을 결제했고 어떤 상태인지 불안하지 않게 확인합니다."
    >
      <PreviewNotice />
      <PrimaryActionPanel
        title="결제가 필요한 의뢰가 없습니다"
        action={
          <Button asChild variant="secondary">
            <Link href="/supervisors">슈퍼바이저 찾기</Link>
          </Button>
        }
      >
        최근 결제는 완료되었고, 현재 검토 단계로 이동했습니다.
      </PrimaryActionPanel>
      <PaymentRows />
    </AppShell>
  );
}

export function DemoPaymentDetailPreview() {
  return (
    <AppShell title="영수증 상세" subtitle="결제 금액, 상태, 연결된 의뢰를 확인합니다.">
      <PreviewNotice />
      <Card className="grid gap-5">
        <Badge tone="brand">결제 완료</Badge>
        <h2 className="text-3xl font-bold text-ink-900">120,000원</h2>
        <SummaryRows
          rows={[
            ["제공 항목", "사례 개념화 50분"],
            ["슈퍼바이저", "이민서"],
            ["결제일", "2026년 6월 14일"],
            ["연결 의뢰", "REQ-1042"]
          ]}
        />
      </Card>
    </AppShell>
  );
}

export function DemoCaseArchivePreview() {
  return (
    <AppShell
      active="case-archive"
      title="학습 기록"
      subtitle="완료된 슈퍼비전을 원노트처럼 슈퍼바이저와 사례 단위로 정리합니다."
      action={
        <Button asChild>
          <Link href="/supervisors">새 슈퍼비전 시작</Link>
        </Button>
      }
    >
      <PreviewNotice />
      <FlowStepNav current="학습 기록" steps={flowSteps} />
      <SectionBlock title="슈퍼비전 노트">
        <div className="grid gap-3">
          <Folder title="이민서 슈퍼바이저" items={["김OO · 종합심리평가 보고서", "이OO · 초기 상담 구조화"]} />
          <Folder title="최유나 슈퍼바이저" items={["박OO · 위기 사례 의사소통"]} />
          <Folder title="한지우 슈퍼바이저" items={["정OO · 부모 상담 피드백"]} />
        </div>
      </SectionBlock>
    </AppShell>
  );
}

export function DemoSettingsPreview() {
  return (
    <AppShell title="계정 설정" subtitle="프로필과 슈퍼비전 업무 정보를 정리합니다.">
      <PreviewNotice />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-4">
          <Card>
            <h2 className="text-xl font-bold text-ink-900">기본 계정</h2>
            <SummaryRows
              rows={[
                ["이메일", "clinician@example.com"],
                ["현재 권한", "슈퍼바이지"],
                ["계정 상태", "사용 중"]
              ]}
            />
          </Card>
          <Card>
            <h2 className="text-xl font-bold text-ink-900">슈퍼바이지 프로필</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InputPreview label="이름" value="김민준" />
              <InputPreview label="소속" value="OO병원 정신건강의학과" />
              <InputPreview label="직무" value="임상심리사" />
              <InputPreview label="관심 영역" value="아동 평가, 부모 상담" />
            </div>
          </Card>
        </section>
        <Card className="h-fit">
          <h2 className="text-lg font-bold text-ink-900">슈퍼바이저 활동</h2>
          <p className="mt-2 text-sm text-ink-600">
            공개 프로필, 자격 증빙, 가능 일정을 등록하면 검토 후 목록에 표시됩니다.
          </p>
          <Button className="mt-4" type="button" variant="secondary">
            슈퍼바이저 신청
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

export function DemoNotificationsPreview() {
  return (
    <AppShell title="알림" subtitle="상태 변화와 필요한 행동만 모아 보여줍니다.">
      <PreviewNotice />
      <div className="grid gap-3">
        {[
          ["추가 자료 요청", "REQ-1042에 보호자 면담 요약이 필요합니다."],
          ["피드백 도착", "초기 상담 구조화 의뢰의 피드백을 확인할 수 있습니다."],
          ["이수 기록 발급", "완료된 슈퍼비전 기록이 학습 기록에 보관되었습니다."]
        ].map(([title, body]) => (
          <Card className="flex items-start gap-3" key={title}>
            <MessageSquareText aria-hidden className="text-brand-600" />
            <div>
              <h2 className="font-bold text-ink-900">{title}</h2>
              <p className="mt-1 text-sm text-ink-600">{body}</p>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function DemoSupervisorHomePreview() {
  return (
    <AppShell
      active="supervisor"
      title="슈퍼바이저 업무"
      subtitle="오늘 처리할 의뢰를 먼저 열고, 필요한 관리 화면으로 이동합니다."
      action={
        <Button asChild>
          <Link href="/supervisor/requests">의뢰 큐 열기</Link>
        </Button>
      }
    >
      <PreviewNotice />
      <PrimaryActionPanel title="추가 자료가 도착한 의뢰를 먼저 확인하세요">
        요청한 보호자 면담 요약이 올라왔습니다. 자료를 확인한 뒤 피드백 초안을
        이어갈 수 있습니다.
      </PrimaryActionPanel>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="grid gap-3">
          {[
            ["추가 자료 도착", "종합심리평가 보고서", "먼저 확인"],
            ["피드백 초안 작성 중", "초기 상담 구조화", "이어 쓰기"],
            ["수락 여부 확인 필요", "부모 상담 피드백", "결정 필요"]
          ].map(([status, title, action]) => (
            <Card
              className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center"
              key={title}
            >
              <div>
                <Badge tone="accent">{status}</Badge>
                <h2 className="mt-3 text-xl font-bold text-ink-900">{title}</h2>
                <p className="mt-1 text-sm text-ink-600">
                  현재 상태와 다음 행동이 연결된 업무입니다.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/supervisor/requests/demo-review">{action}</Link>
              </Button>
            </Card>
          ))}
        </section>
        <SideLinks />
      </div>
    </AppShell>
  );
}

export function DemoSupervisorRequestsPreview() {
  return (
    <AppShell
      active="supervisor"
      title="의뢰 큐"
      subtitle="수락, 보완 요청, 피드백 작성이 필요한 의뢰를 순서대로 봅니다."
    >
      <PreviewNotice />
      <SectionBlock title="지금 처리할 의뢰">
        <div className="grid gap-3">
          {[
            ["추가 자료 확인", "종합심리평가 보고서", "REQ-1042"],
            ["피드백 작성", "초기 상담 구조화", "REQ-1038"],
            ["수락 여부 결정", "부모 상담 피드백", "REQ-1034"]
          ].map(([status, title, code]) => (
            <Card
              className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center"
              key={code}
            >
              <div>
                <Badge tone="accent">{status}</Badge>
                <h2 className="mt-3 text-xl font-bold text-ink-900">{title}</h2>
                <p className="mt-1 text-sm text-ink-600">{code} · 일정 확인 필요</p>
              </div>
              <Button asChild>
                <Link href="/supervisor/requests/demo-review">상세 검토</Link>
              </Button>
            </Card>
          ))}
        </div>
      </SectionBlock>
    </AppShell>
  );
}

export function DemoSupervisorRequestDetailPreview() {
  return (
    <main className="min-h-screen bg-surface-base text-ink-900">
      <SiteHeader active="supervisor" actionHref="/supervisor/requests" actionLabel="의뢰 큐" />
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
        <PreviewNotice />
        <div className="grid gap-6 lg:grid-cols-[300px_1fr_320px]">
          <Card className="h-fit">
            <Badge tone="accent">추가 자료 도착</Badge>
            <h1 className="mt-3 text-2xl font-bold">REQ-1042</h1>
            <SummaryRows
              rows={[
                ["세션", "사례 개념화 50분"],
                ["예약", "6월 18일 19:00"],
                ["자료", "사례요약, 검사결과, 면담요약"],
                ["상태", "피드백 작성 가능"]
              ]}
            />
          </Card>
          <Card className="min-h-[560px]">
            <div className="flex items-center gap-3">
              <FolderOpen aria-hidden className="text-brand-600" />
              <h2 className="text-xl font-bold">사례 자료 검토</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {["사례요약.pdf", "검사결과.pdf", "보호자면담요약.docx"].map((name) => (
                <div
                  className="flex items-center justify-between rounded-md border border-line bg-surface-base p-4"
                  key={name}
                >
                  <span className="font-semibold">{name}</span>
                  <Button size="sm" variant="secondary">열람</Button>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md border border-line bg-surface-sunken p-5">
              <h3 className="font-bold">피드백 초안</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                강점, 보완 자료, 다음 상담에서 확인할 질문을 짧게 정리합니다.
              </p>
            </div>
          </Card>
          <Card className="h-fit">
            <h2 className="text-xl font-bold">다음 행동</h2>
            <p className="mt-2 text-sm text-ink-600">
              자료 확인 후 피드백을 제출하거나 보완 요청을 남깁니다.
            </p>
            <div className="mt-4 grid gap-2">
              <Button type="button">피드백 제출</Button>
              <Button type="button" variant="secondary">
                보완 요청
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

export function DemoSupervisorProfilePreview() {
  return (
    <AppShell title="공개 프로필" subtitle="사진, 자격, 전문 분야, 자기소개를 관리합니다.">
      <PreviewNotice />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-xl font-bold text-ink-900">프로필 입력</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InputPreview label="공개 이름" value="이민서 슈퍼바이저" />
            <InputPreview label="자격" value="임상심리전문가, 정신건강임상심리사 1급" />
            <InputPreview label="전문 분야" value="아동·청소년 평가, 부모 상담" />
            <InputPreview label="자기소개" value="평가 결과를 상담 장면에서 쓰기 쉬운 언어로 정리합니다." />
          </div>
        </Card>
        <Card>
          <div className="grid place-items-center rounded-md bg-surface-sunken p-8">
            <span className="grid size-20 place-items-center rounded-md bg-brand-50 text-2xl font-bold text-brand-700">
              이
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold">이민서 슈퍼바이저</h2>
          <p className="mt-2 text-sm text-ink-600">
            아동·청소년 평가와 부모 상담을 중심으로 사례 개념화를 돕습니다.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

export function DemoSupervisorAvailabilityPreview() {
  return (
    <AppShell title="가능 일정" subtitle="슈퍼비전을 받을 수 있는 시간대를 정리합니다.">
      <PreviewNotice />
      <div className="grid gap-4 md:grid-cols-3">
        {["월 19:00", "수 20:00", "토 10:00"].map((slot) => (
          <Card key={slot}>
            <CalendarDays aria-hidden className="text-brand-600" />
            <h2 className="mt-3 text-xl font-bold">{slot}</h2>
            <p className="mt-2 text-sm text-ink-600">온라인 50분 세션 가능</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function DemoSupervisorProductsPreview() {
  return (
    <AppShell title="제공 항목 관리" subtitle="슈퍼비전 방식, 시간, 가격을 명확히 보여줍니다.">
      <PreviewNotice />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["사례 개념화", "50분", "120,000원"],
          ["보고서 피드백", "문서 검토", "90,000원"],
          ["부모 상담 준비", "50분", "110,000원"]
        ].map(([title, time, price]) => (
          <Card key={title}>
            <Badge tone="brand">{time}</Badge>
            <h2 className="mt-3 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-ink-600">{price}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function DemoSupervisorMemoryPreview() {
  return (
    <AppShell title="슈퍼비전 노트" subtitle="반복되는 슈퍼비전 맥락을 사례별 노트처럼 정리합니다.">
      <PreviewNotice />
      <div className="grid gap-3">
        <Folder title="평가 보고서 피드백" items={["진단 가설 표현", "보호자 설명 문장", "추가 검사 판단"]} />
        <Folder title="초기 상담 구조화" items={["목표 합의", "위험도 확인", "다음 회기 질문"]} />
      </div>
    </AppShell>
  );
}

export function DemoSupervisorPayoutsPreview() {
  return (
    <AppShell title="정산 내역" subtitle="슈퍼비전 완료 후 정산 상태를 확인합니다.">
      <PreviewNotice />
      <div className="grid gap-3">
        {[
          ["정산 예정", "이민서 슈퍼바이저", "120,000원"],
          ["정산 완료", "최유나 슈퍼바이저", "90,000원"]
        ].map(([status, name, amount]) => (
          <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center" key={name}>
            <div>
              <Badge tone={status === "정산 완료" ? "brand" : "accent"}>{status}</Badge>
              <h2 className="mt-3 text-xl font-bold">{name}</h2>
            </div>
            <p className="text-2xl font-bold">{amount}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function DemoSupervisorQualificationsPreview() {
  return (
    <AppShell title="자격 검증" subtitle="공개 목록에 필요한 자격 자료를 정리합니다.">
      <PreviewNotice />
      <Card>
        <Badge tone="accent">검토 중</Badge>
        <h2 className="mt-3 text-xl font-bold">임상심리전문가 자격 확인</h2>
        <p className="mt-2 text-sm text-ink-600">
          제출된 자격 자료를 운영자가 확인한 뒤 공개 프로필에 반영합니다.
        </p>
      </Card>
    </AppShell>
  );
}

function PaymentRows() {
  return (
    <div className="grid gap-3">
      {[
        ["결제 완료", "사례 개념화 50분", "120,000원"],
        ["영수증 가능", "초기 상담 구조화", "90,000원"]
      ].map(([status, title, amount]) => (
        <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center" key={title}>
          <div>
            <Badge tone="brand">{status}</Badge>
            <h2 className="mt-3 text-xl font-bold text-ink-900">{title}</h2>
            <p className="mt-1 text-sm text-ink-600">연결 의뢰와 결제일을 확인합니다.</p>
          </div>
          <p className="text-2xl font-bold text-ink-900">{amount}</p>
        </Card>
      ))}
    </div>
  );
}

function SideLinks() {
  return (
    <aside className="grid content-start gap-3">
      {[
        ["/supervisor/profile", "공개 프로필", "소개, 자격, 전문 분야"],
        ["/supervisor/products", "제공 항목", "세션 유형과 가격"],
        ["/supervisor/availability", "가능 일정", "예약 가능한 시간"],
        ["/supervisor/memory", "슈퍼비전 노트", "반복되는 피드백 맥락"]
      ].map(([href, title, body]) => (
        <Link
          className="rounded-md border border-line bg-surface-elevated p-4 transition hover:bg-surface-sunken"
          href={href as never}
          key={href}
        >
          <h2 className="font-bold text-ink-900">{title}</h2>
          <p className="mt-1 text-sm text-ink-500">{body}</p>
        </Link>
      ))}
    </aside>
  );
}

function Folder({ items, title }: { items: string[]; title: string }) {
  return (
    <details className="rounded-md border border-line bg-surface-elevated p-5 shadow-card" open>
      <summary className="cursor-pointer text-lg font-bold text-ink-900">
        {title}
      </summary>
      <div className="mt-4 grid gap-2 border-l border-line pl-4">
        {items.map((item) => (
          <Link
            className="rounded-md px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-surface-sunken"
            href="/requests/demo-additional-info"
            key={item}
          >
            ㄴ {item}
          </Link>
        ))}
      </div>
    </details>
  );
}

function InputPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-md border border-line bg-surface-base p-4">
      <span className="text-xs font-bold text-ink-500">{label}</span>
      <span className="text-sm font-semibold leading-relaxed text-ink-900">{value}</span>
    </div>
  );
}

function SummaryRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="mt-4 grid gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div
          className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0"
          key={label}
        >
          <dt className="font-semibold text-ink-500">{label}</dt>
          <dd className="max-w-[65%] text-right font-bold text-ink-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function IconStat({
  body,
  icon,
  title
}: {
  body: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card className="flex items-start gap-3">
      <span className="text-brand-600">{icon}</span>
      <div>
        <h2 className="font-bold text-ink-900">{title}</h2>
        <p className="mt-1 text-sm text-ink-600">{body}</p>
      </div>
    </Card>
  );
}

export const previewHighlights = [
  {
    body: "슈퍼바이저 선택부터 학습 기록까지 한 흐름으로 이어집니다.",
    icon: <GraduationCap aria-hidden />,
    title: "교육 흐름"
  },
  {
    body: "자료 제출, 결제, 피드백 확인의 다음 행동이 먼저 보입니다.",
    icon: <CheckCircle2 aria-hidden />,
    title: "다음 행동"
  },
  {
    body: "결제 내역과 이수 기록은 의뢰와 연결되어 남습니다.",
    icon: <CreditCard aria-hidden />,
    title: "기록 연결"
  },
  {
    body: "슈퍼바이저는 처리할 의뢰를 우선순위로 확인합니다.",
    icon: <ClipboardList aria-hidden />,
    title: "업무 큐"
  }
];

export function DemoHighlights() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {previewHighlights.map((item) => (
        <IconStat key={item.title} {...item} />
      ))}
    </div>
  );
}

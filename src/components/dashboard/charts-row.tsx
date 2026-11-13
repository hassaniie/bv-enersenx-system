"use client";

import { ChartColumnIcon, ChartSplineIcon, PiggyBankIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPkr, type DashboardData } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

import { Panel } from "./panel";
import { PanelState, type PanelStatus } from "./panel-state";

type RowProps = {
  status: PanelStatus;
  data: DashboardData;
  error?: string;
  onRetry: () => void;
};

const loadConfig = {
  today: {
    label: "Today",
    theme: { light: "var(--color-cyan-500)", dark: "var(--color-cyan-400)" },
  },
  yesterday: {
    label: "Yesterday",
    theme: { light: "var(--color-red-400)", dark: "var(--color-red-300)" },
  },
} satisfies ChartConfig;

const costConfig = {
  baseline: {
    label: "Baseline cost",
    theme: { light: "var(--color-blue-200)", dark: "var(--color-blue-900)" },
  },
  actual: {
    label: "Actual cost",
    theme: { light: "var(--color-blue-600)", dark: "var(--color-blue-500)" },
  },
} satisfies ChartConfig;

const gaugeConfig = {
  savings: { label: "Savings", color: "var(--success)" },
} satisfies ChartConfig;

const chartSkeleton = <Skeleton className="h-60 w-full" />;

export function ChartsRow({ status, data, error, onRetry }: RowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @7xl:grid-cols-[2fr_2fr_1fr]">
      <Panel title="Real-time load curve" hint="kW" meta="Last 24h">
        <PanelState
          status={status}
          isEmpty={data.loadCurve.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={chartSkeleton}
          empty={{
            icon: <ChartSplineIcon />,
            title: "No load readings yet",
            description: "Readings appear once a meter reports.",
            action: "Check meters",
          }}
        >
          <ChartContainer
            config={loadConfig}
            className="aspect-auto h-60 w-full"
          >
            <AreaChart
              data={data.loadCurve}
              margin={{ top: 12, left: -16, right: 20 }}
            >
              <defs>
                <linearGradient id="fill-today" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-today)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-today)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="fill-yesterday" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-yesterday)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-yesterday)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={1}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[0, 2500]}
                ticks={[0, 500, 1000, 1500, 2000, 2500]}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "4 4" }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <ReferenceLine
                y={data.peakKw}
                stroke="var(--destructive)"
                strokeDasharray="4 4"
                label={{
                  value: "Peak curve",
                  position: "insideTopLeft",
                  fill: "var(--destructive)",
                  fontSize: 11,
                }}
              />
              <Area
                dataKey="yesterday"
                type="monotone"
                stroke="var(--color-yesterday)"
                fill="url(#fill-yesterday)"
                strokeWidth={1.5}
                dot={{ r: 3, fill: "var(--color-yesterday)" }}
                activeDot={{ r: 4 }}
              />
              <Area
                dataKey="today"
                type="monotone"
                stroke="var(--color-today)"
                fill="url(#fill-today)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-today)" }}
                activeDot={{ r: 4 }}
              />
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </PanelState>
      </Panel>

      <Panel title="Energy cost comparison" hint="PKR millions" meta="Monthly">
        <PanelState
          status={status}
          isEmpty={data.costComparison.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={chartSkeleton}
          empty={{
            icon: <ChartColumnIcon />,
            title: "No billing data",
            description: "Add a tariff to compare costs.",
            action: "Add tariff",
          }}
        >
          <ChartContainer
            config={costConfig}
            className="aspect-auto h-60 w-full"
          >
            <BarChart
              data={data.costComparison}
              margin={{ top: 12, left: -20, right: 8 }}
              barGap={4}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="baseline"
                fill="var(--color-baseline)"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="actual"
                fill="var(--color-actual)"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        </PanelState>
      </Panel>

      <Panel
        title="Saving summary"
        meta="Monthly"
        className="@3xl:col-span-2 @7xl:col-span-1"
      >
        <PanelState
          status={status}
          isEmpty={data.savings.baselineCost === 0}
          error={error}
          onRetry={onRetry}
          skeleton={chartSkeleton}
          empty={{
            icon: <PiggyBankIcon />,
            title: "No baseline set",
            description: "Set a baseline to track savings.",
            action: "Set baseline",
          }}
        >
          <div className="@container/summary flex flex-1 flex-col gap-4">
            <div className="flex flex-1 flex-col justify-center gap-4 @xl/summary:flex-row @xl/summary:items-center @xl/summary:gap-10">
              <div className="flex shrink-0 flex-col gap-1 @xl/summary:w-56">
                <div className="relative mx-auto w-full max-w-56">
                  <ChartContainer
                    config={gaugeConfig}
                    className="aspect-[2/1] w-full"
                  >
                    <RadialBarChart
                      data={[
                        {
                          name: "savings",
                          value: data.savings.percent,
                          fill: "url(#gauge-fill)",
                        },
                      ]}
                      startAngle={180}
                      endAngle={0}
                      cy="100%"
                      innerRadius={84}
                      outerRadius={104}
                    >
                      <defs>
                        <linearGradient
                          id="gauge-fill"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop offset="0%" stopColor="var(--warning)" />
                          <stop offset="100%" stopColor="var(--success)" />
                        </linearGradient>
                      </defs>
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <RadialBar dataKey="value" background cornerRadius={8} />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {data.savings.percent}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Total savings
                    </span>
                  </div>
                </div>
                <div className="mx-auto flex w-full max-w-56 justify-between text-xs text-muted-foreground tabular-nums">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              <dl className="flex flex-1 flex-col gap-2 text-sm">
                <SummaryRow
                  label="Baseline cost"
                  value={data.savings.baselineCost}
                />
                <SummaryRow
                  label="Actual cost"
                  value={data.savings.actualCost}
                />
                <SummaryRow
                  label="Total savings"
                  value={data.savings.totalSavings}
                  strong
                />
              </dl>
            </div>
          </div>
        </PanelState>
      </Panel>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-2",
        strong && "border-t pt-2",
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-1">
        <span
          className={
            strong ? "font-semibold tabular-nums" : "font-medium tabular-nums"
          }
        >
          {formatPkr(value)}
        </span>
        <span className="text-xs text-muted-foreground">PKR</span>
      </dd>
    </div>
  );
}

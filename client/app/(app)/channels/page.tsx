"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { useMutation } from "@/lib/use-mutation";
import { useAuth } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { isManager } from "@/lib/rbac";
import type { Channel, ChannelType, ProductLine } from "@/lib/types";
import { CHANNEL_TYPE_LABEL, CHANNEL_STATUS_LABEL } from "@/lib/labels";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  ListSkeleton,
  PageHeader,
} from "@/components/ui";

const CHANNEL_TYPES: ChannelType[] = [
  "WORDPRESS",
  "GHOST",
  "FACEBOOK",
  "LINKEDIN",
  "X",
];

export default function ChannelsPage() {
  const { user } = useAuth();
  const canManage = isManager(user?.role);

  const channels = useApi<Channel[]>(() => resources.channels.list(), "channels");
  const productLines = useApi<ProductLine[]>(() => resources.productLines.list(), "product-lines");
  const { run, busy } = useMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("WORDPRESS");
  const [plId, setPlId] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [credentials, setCredentials] = useState("");

  function create() {
    const config: Record<string, unknown> = {};
    if (type === "WORDPRESS" || type === "GHOST") {
      config.siteUrl = siteUrl;
    }

    run(
      () =>
        resources.channels.create({
          productLineId: plId,
          type,
          name,
          config,
          credentials,
        }),
      {
        success: `Đã tạo kênh "${name}"`,
        onSuccess: () => {
          setName("");
          setSiteUrl("");
          setCredentials("");
          setOpen(false);
          channels.reload();
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Quản lý kênh"
        title="Kênh đăng bài"
        subtitle="Kết nối với các nền tảng đăng nội dung."
        action={
          canManage && (
            <Button variant="primary" onClick={() => setOpen((o) => !o)}>
              Thêm kênh
            </Button>
          )
        }
      />

      {open && canManage && (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên kênh">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="WordPress Blog"
                />
              </Field>
              <Field label="Dòng sản phẩm">
                <select
                  value={plId}
                  onChange={(e) => setPlId(e.target.value)}
                  required
                  className="w-full rounded-md border border-muted/20 bg-surface px-3 py-2 text-sm"
                >
                  <option value="">Chọn dòng sản phẩm</option>
                  {productLines.data?.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loại kênh">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ChannelType)}
                  className="w-full rounded-md border border-muted/20 bg-surface px-3 py-2 text-sm"
                >
                  {CHANNEL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {CHANNEL_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>
              {(type === "WORDPRESS" || type === "GHOST") && (
                <Field label="Site URL">
                  <Input
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    required
                    placeholder="https://myblog.com"
                  />
                </Field>
              )}
            </div>
            <Field label="Credentials (user:app_password)">
              <Input
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                required
                type="password"
                placeholder="admin:xxxx xxxx xxxx xxxx"
              />
            </Field>
            <div>
              <Button type="submit" variant="primary" loading={busy}>
                Tạo kênh
              </Button>
            </div>
          </form>
        </Card>
      )}

      {channels.error ? (
        <ErrorState message={channels.error} onRetry={channels.reload} />
      ) : channels.loading || !channels.data ? (
        <ListSkeleton rows={3} />
      ) : !channels.data.length ? (
        <EmptyState
          icon="megaphone"
          title="Chưa có kênh nào"
          hint={
            canManage
              ? "Tạo kênh đầu tiên để bắt đầu đăng bài."
              : "Chưa có kênh nào được tạo."
          }
          action={
            canManage && (
              <Button variant="primary" onClick={() => setOpen(true)}>
                Tạo kênh
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.data.map((ch) => (
            <Card key={ch.id} className="p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-paper text-muted">
                  <Icon name="megaphone" size={18} />
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium">{ch.name}</div>
                  <div className="truncate text-xs text-muted">
                    {CHANNEL_TYPE_LABEL[ch.type]}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge
                  tone={
                    ch.status === "ACTIVE" ? "accent" : "neutral"
                  }
                >
                  {CHANNEL_STATUS_LABEL[ch.status]}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

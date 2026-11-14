import { supabase } from '@/lib/supabase';

export type HostKind = 'company' | 'individual';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'host';

/**
 * Registers the signed-in user as a host. RLS only allows status='pending', and the
 * on_host_created trigger makes the caller its owner; a marketplace admin approves it.
 * (Host registration fee / subscription billing is a later phase.)
 */
export async function applyAsHost(input: {
  kind: HostKind;
  name: string;
  city: string;
  phone: string;
  businessRegNo: string | null;
}) {
  if (!supabase) {
    await new Promise((r) => setTimeout(r, 1000)); // demo mode
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Please sign in first');
  const { error } = await supabase.from('hosts').insert({
    kind: input.kind,
    name: input.name,
    slug: `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`,
    city: input.city,
    phone: input.phone,
    business_reg_no: input.kind === 'company' ? input.businessRegNo : null,
    status: 'pending',
  });
  if (error) throw error;
}

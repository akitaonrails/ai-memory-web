# Pointing aimemory.io (GoDaddy) at Netlify

Do this after the first deploy works on the `.netlify.app` address. There are two ways. Option A is less work and is what Netlify recommends for a bare domain like `aimemory.io`.

Netlify shows the exact records for your site in its UI. If anything below differs from what Netlify shows you, use Netlify's values.

## First, in Netlify

1. Open the project, then Domain management, Add a domain.
2. Enter `aimemory.io`. Netlify says the domain is registered elsewhere. Confirm that you own it.
3. Netlify adds `aimemory.io` as the primary domain and `www.aimemory.io` as an alias. `netlify.toml` already redirects `www` to the bare domain.

## Option A: let Netlify run the DNS (recommended)

1. In Domain management, next to `aimemory.io`, choose "Set up Netlify DNS" and click through. At the end Netlify lists four nameservers that look like `dns1.p01.nsone.net`.
2. In GoDaddy: My Products, find `aimemory.io`, DNS, Nameservers, Change nameservers, "I'll use my own nameservers". Paste the four from Netlify and save. GoDaddy asks you to confirm.
3. Wait. It usually takes under an hour and can take up to 48.

After the switch, GoDaddy's DNS page no longer does anything. All records live in Netlify, including any you add later. If you plan to receive email at `@aimemory.io`, add the provider's MX and TXT records in Netlify DNS, not GoDaddy. If GoDaddy email forwarding is already on, copy its MX records to Netlify before switching nameservers, or mail stops.

## Option B: keep DNS at GoDaddy

In GoDaddy: My Products, `aimemory.io`, DNS, DNS Records.

1. Delete the default `A` record for `@` that points to "Parked" or a GoDaddy IP. Also turn off any domain Forwarding on the same page. Forwarding overrides your records.
2. Add:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `75.2.60.5` | 1 hour |
| CNAME | `www` | `<your-site>.netlify.app` | 1 hour |

`75.2.60.5` is Netlify's load balancer. Confirm it in the Netlify UI under Domain management, "Awaiting external DNS", because GoDaddy cannot point a bare domain at a hostname. If a `www` CNAME already exists, edit it.

## HTTPS

Netlify requests a Let's Encrypt certificate by itself once DNS resolves to it. Check Domain management, HTTPS. If it still says "Waiting on DNS propagation" after a few hours, click "Verify DNS configuration", then "Provision certificate". Once the certificate is active, turn on "Force HTTPS".

## Check it

```bash
dig +short aimemory.io            # Option B: 75.2.60.5. Option A: Netlify addresses
dig +short NS aimemory.io         # Option A: the nsone.net nameservers
curl -sI https://aimemory.io | head -5
curl -sI https://www.aimemory.io | grep -i location   # should redirect to https://aimemory.io/
```

## Things that commonly go wrong

- The site shows a GoDaddy parking page: the old `A` record or Forwarding is still there.
- The certificate never arrives: a leftover `AAAA` record or a `CAA` record that does not allow `letsencrypt.org`. Delete the first, fix the second.
- The domain works but `www` does not: the `www` CNAME is missing, or you are on Option A and the nameserver change has not propagated yet.
- Keep GoDaddy's auto-renew on and domain privacy enabled. Losing the domain loses everything else in this document.

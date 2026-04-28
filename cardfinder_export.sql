--
-- PostgreSQL database dump
--

\restrict If1E2p2BUXxdTCdiVTqBHGZWVWoTyZ1a2EZ1Q0w9MEhwQ7CakXZbL4I6E0eRM82

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    email character varying(255),
    password_hash character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    admin_user character varying(255),
    table_name character varying(100),
    field_name character varying(100),
    old_value text,
    new_value text,
    changed_at timestamp without time zone DEFAULT now(),
    action_type character varying(100),
    card_id integer,
    card_name character varying(255)
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: card_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_rates (
    id integer NOT NULL,
    card_id integer,
    category_id integer,
    cashback_rate numeric,
    monthly_cap numeric
);


--
-- Name: card_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.card_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: card_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.card_rates_id_seq OWNED BY public.card_rates.id;


--
-- Name: cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cards (
    id integer NOT NULL,
    name character varying(255),
    bank character varying(255),
    card_category character varying(255),
    annual_fee numeric,
    fee_notes text,
    min_salary numeric,
    status character varying(50) DEFAULT 'active'::character varying,
    apply_link character varying(500),
    key_benefits text,
    eligibility_notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cards_id_seq OWNED BY public.cards.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100),
    label character varying(100),
    display_order integer,
    is_active boolean DEFAULT true,
    slug character varying(100),
    icon character varying(30),
    default_spend numeric DEFAULT 0,
    min_spend numeric DEFAULT 0,
    max_spend numeric DEFAULT 10000
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: income_brackets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.income_brackets (
    id integer NOT NULL,
    label character varying(50),
    value numeric,
    bracket character varying(50)
);


--
-- Name: income_brackets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.income_brackets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: income_brackets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.income_brackets_id_seq OWNED BY public.income_brackets.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    email character varying(255),
    income_range character varying(50),
    nationality character varying(100),
    consent boolean,
    status character varying(50) DEFAULT 'New'::character varying,
    utm_source character varying(255),
    utm_medium character varying(255),
    utm_campaign character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: spending_benchmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spending_benchmarks (
    id integer NOT NULL,
    income_bracket character varying(50),
    category_id integer,
    monthly_amount numeric
);


--
-- Name: spending_benchmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.spending_benchmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: spending_benchmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.spending_benchmarks_id_seq OWNED BY public.spending_benchmarks.id;


--
-- Name: user_calculations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_calculations (
    id integer NOT NULL,
    user_id integer,
    monthly_income numeric,
    spending jsonb,
    top_cards jsonb,
    net_savings numeric,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_calculations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_calculations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_calculations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_calculations_id_seq OWNED BY public.user_calculations.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    income_range text NOT NULL,
    nationality text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    income_range character varying(100),
    nationality character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: card_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_rates ALTER COLUMN id SET DEFAULT nextval('public.card_rates_id_seq'::regclass);


--
-- Name: cards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: income_brackets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_brackets ALTER COLUMN id SET DEFAULT nextval('public.income_brackets_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: spending_benchmarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spending_benchmarks ALTER COLUMN id SET DEFAULT nextval('public.spending_benchmarks_id_seq'::regclass);


--
-- Name: user_calculations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_calculations ALTER COLUMN id SET DEFAULT nextval('public.user_calculations_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_users (id, email, password_hash, created_at) FROM stdin;
1	admin@cardfiner.ae	$2b$10$zdyEAb2plld2Ax7uOb.To.qGGbVRmeWmERt6vcIP2jlr4Nv207Iei	2026-04-27 23:05:02.249561
2	admin@cardfinder.ae	$2b$10$pg/X3x39roQj9bz19TsuCe9ts77OWLNACsrknuiDgJKMQojXm8QcW	2026-04-28 17:34:54.557505
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, admin_user, table_name, field_name, old_value, new_value, changed_at, action_type, card_id, card_name) FROM stdin;
1	admin@cardfinder.ae	card_rates	groceries	2.50	3.00	2026-03-29 16:50:32.814	UPDATED CASHBACK	1	ADCB 365 Cashback Credit Card
2	admin@cardfinder.ae	card_rates	dining	1.00	2.00	2026-04-01 16:50:32.82	UPDATED CASHBACK	2	Emirates NBD Cashback Credit Card
3	admin@cardfinder.ae	cards	annual_fee	500	450	2026-04-04 16:50:32.82	ASSET UPDATE	3	HSBC Live+ Cashback Credit Card
4	admin@cardfinder.ae	cards	status	active	inactive	2026-04-07 16:50:32.821	STATUS CHANGE	1	ADCB 365 Cashback Credit Card
5	admin@cardfinder.ae	card_rates	travel	0.00	3.50	2026-04-10 16:50:32.822	UPDATED CASHBACK	4	Dubai First Cashback Credit Card
6	admin@cardfinder.ae	cards	apr	22.99	19.99	2026-04-13 16:50:32.823	MODIFIED APR	2	Emirates NBD Cashback Credit Card
7	admin@cardfinder.ae	cards	status	inactive	active	2026-04-16 16:50:32.824	STATUS CHANGE	5	Liv. Cashback Credit Card
8	admin@cardfinder.ae	card_rates	fuel	1.50	2.00	2026-04-19 16:50:32.825	UPDATED CASHBACK	3	HSBC Live+ Cashback Credit Card
9	admin@cardfinder.ae	cards	annual_fee	0	300	2026-04-22 16:50:32.826	ASSET UPDATE	6	Rakbank Red Credit Card
10	admin@cardfinder.ae	card_rates	shopping	1.00	1.50	2026-04-25 16:50:32.826	UPDATED CASHBACK	1	ADCB 365 Cashback Credit Card
11	admin@cardfiner.ae	card_rates	car_rental	0.01	0.02	2026-04-28 17:40:34.073476	UPDATED CASHBACK	1	ADCB 365 Cashback Credit Card
12	admin@cardfiner.ae	card_rates	car_rental	0.02	0.01	2026-04-28 17:40:38.237755	UPDATED CASHBACK	1	ADCB 365 Cashback Credit Card
13	admin@cardfiner.ae	cards	created		Falcon Sayan	2026-04-28 17:41:38.091439	ASSET UPDATE	7	Falcon Sayan
14	admin@cardfiner.ae	card_rates	groceries	0	10	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
15	admin@cardfiner.ae	card_rates	dining	0	5	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
16	admin@cardfiner.ae	card_rates	travel	0	4	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
17	admin@cardfiner.ae	card_rates	fuel	0	2	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
18	admin@cardfiner.ae	card_rates	shopping	0	5	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
19	admin@cardfiner.ae	card_rates	utilities	0	5	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
20	admin@cardfiner.ae	card_rates	car_rental	0	2	2026-04-28 17:42:13.623478	UPDATED CASHBACK	7	Falcon Sayan
21	admin@cardfiner.ae	cards	card	Liv. Cashback Credit Card	deleted	2026-04-28 18:05:33.55615	ASSET UPDATE	\N	Liv. Cashback Credit Card
22	admin@cardfiner.ae	cards	card	Falcon Sayan	deleted	2026-04-28 18:05:59.248408	ASSET UPDATE	\N	Falcon Sayan
23	admin@cardfiner.ae	cards	card	Liv. Cashback Credit Card	deleted	2026-04-28 18:24:48.175019	ASSET UPDATE	\N	Liv. Cashback Credit Card
\.


--
-- Data for Name: card_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.card_rates (id, card_id, category_id, cashback_rate, monthly_cap) FROM stdin;
8	2	1	0.05	200
9	2	2	0.05	200
10	2	3	0.02	200
11	2	4	0.05	200
12	2	5	0.015	200
13	2	6	0.05	200
14	2	7	0.005	200
15	3	1	0.02	200
16	3	2	0.06	200
17	3	3	0.005	200
18	3	4	0.05	200
19	3	5	0.005	200
20	3	6	0.005	200
21	3	7	0.005	200
22	4	1	0.05	250
23	4	2	0.05	250
24	4	3	0.005	250
25	4	4	0.05	250
26	4	5	0.005	250
27	4	6	0.005	250
28	4	7	0.005	250
36	6	1	0.015	250
37	6	2	0.015	250
38	6	3	0.015	250
39	6	4	0.003	250
40	6	5	0.015	250
41	6	6	0.003	250
42	6	7	0.003	250
50	1	1	0.05	\N
51	1	2	0.06	\N
52	1	3	0.01	\N
53	1	4	0.03	\N
54	1	5	0.01	\N
55	1	6	0.03	\N
56	1	7	0.01	\N
64	9	1	0.02	187
65	9	2	0.02	187
66	9	3	0.02	187
67	9	4	0.001	187
68	9	5	0.02	187
69	9	6	0.001	187
70	9	7	0.001	187
\.


--
-- Data for Name: cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cards (id, name, bank, card_category, annual_fee, fee_notes, min_salary, status, apply_link, key_benefits, eligibility_notes, created_at) FROM stdin;
1	ADCB 365 Cashback Credit Card	ADCB	cashback	383	Free year 1; AED 383 from year 2. Monthly cashback cap AED 1000. Min spend AED 5000/mo required.	8000	active		Up to 6% cashback on dining, 5% on groceries	Min salary AED 8000	2026-04-27 18:11:16.646944
2	Emirates NBD Cashback Credit Card	Emirates NBD	cashback	300	Min salary AED 5000. Cashback on groceries, fuel and utilities via ENBD tiered programme.	5000	active		Up to 5% cashback on groceries, fuel, utilities	Min salary AED 5000	2026-04-27 18:11:16.646944
3	HSBC Live+ Cashback Credit Card	HSBC UAE	cashback	314	Free year 1; AED 314 from year 2, waived with AED 12000 annual spend. Min spend AED 3000/mo for bonus rates. Per-category cap AED 200/statement.	10000	active		6% cashback on dining, 5% on fuel	Min salary AED 10000	2026-04-27 18:11:16.646944
4	Dubai First Cashback Credit Card	Dubai First	cashback	399	AED 399/yr waived with AED 24000 annual spend. Monthly cap AED 1000.	5000	active		Up to 5% cashback on groceries, dining and fuel	Min salary AED 5000	2026-04-27 18:11:16.646944
6	Rakbank Red Credit Card	Rakbank	cashback	0	Free for life. Up to 1.5% cashback on retail spends. Max AED 1000 cashback/mo.	5000	active		Up to 1.5% cashback on retail, free for life	Min salary AED 5000	2026-04-27 18:11:16.646944
9	Liv. Cashback Credit Card	Liv. (Emirates NBD)	cashback	0	Free for life. Tiered flat cashback: 2% spend >= AED 10000/mo; 1.5% AED 5000-10000; 0.75% below AED 5000. Cap AED 750/mo.	5000	active	\N	\N	\N	2026-04-28 18:20:34.840259
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, label, display_order, is_active, slug, icon, default_spend, min_spend, max_spend) FROM stdin;
1	groceries	Groceries	1	t	groceries	🛒	1600	0	5000
2	dining	Dining	2	t	dining	🍽️	600	0	3000
3	travel	Travel	3	t	travel	✈️	400	0	5000
4	fuel	Fuel	4	t	fuel	⛽	500	0	2000
5	shopping	Shopping	5	t	shopping	🛍️	1000	0	5000
6	utilities	Utilities	6	t	utilities	🔧	1000	0	3000
7	car_rental	Car Rental	7	t	car_rental	🚗	500	0	3000
\.


--
-- Data for Name: income_brackets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.income_brackets (id, label, value, bracket) FROM stdin;
1	5K	5000	5K-10K
2	10K	10000	10K-20K
3	25K	25000	20K-30K
4	50K	50000	30K-50K
5	75K	75000	50K+
6	100K	100000	50K+
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, email, income_range, nationality, consent, status, utm_source, utm_medium, utm_campaign, created_at) FROM stdin;
\.


--
-- Data for Name: spending_benchmarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spending_benchmarks (id, income_bracket, category_id, monthly_amount) FROM stdin;
1	5K-10K	1	800
2	5K-10K	2	400
3	5K-10K	3	300
4	5K-10K	4	300
5	5K-10K	5	500
6	5K-10K	6	400
7	5K-10K	7	0
8	10K-20K	1	1200
9	10K-20K	2	800
10	10K-20K	3	700
11	10K-20K	4	500
12	10K-20K	5	1000
13	10K-20K	6	600
14	10K-20K	7	300
15	20K-30K	1	1800
16	20K-30K	2	1500
17	20K-30K	3	1200
18	20K-30K	4	700
19	20K-30K	5	2000
20	20K-30K	6	800
21	20K-30K	7	600
22	30K-50K	1	2500
23	30K-50K	2	2500
24	30K-50K	3	2000
25	30K-50K	4	900
26	30K-50K	5	3500
27	30K-50K	6	1000
28	30K-50K	7	1000
29	50K+	1	3500
30	50K+	2	4000
31	50K+	3	4000
32	50K+	4	1200
33	50K+	5	6000
34	50K+	6	1500
35	50K+	7	2000
\.


--
-- Data for Name: user_calculations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_calculations (id, user_id, monthly_income, spending, top_cards, net_savings, created_at) FROM stdin;
1	7	20000	{"dining": 600, "groceries": 1600}	[{"id": 1, "bank": "ADCB", "name": "ADCB 365", "cashback_breakdown": {"dining": 432, "groceries": 960}, "net_annual_savings": 1200}]	1200	2026-04-28 22:08:23.288877
2	1	25000	{"fuel": 500, "dining": 600, "travel": 400, "shopping": 1000, "groceries": 1600, "utilities": 1000, "car_rental": 500}	[{"id": 2, "bank": "Emirates NBD", "name": "Emirates NBD Cashback Credit Card", "cashback_breakdown": {"fuel": 300, "dining": 360, "travel": 96, "shopping": 180, "groceries": 960, "utilities": 600, "car_rental": 30}, "net_annual_savings": 2226}, {"id": 1, "bank": "ADCB", "name": "ADCB 365 Cashback Credit Card", "cashback_breakdown": {"fuel": 180, "dining": 432, "travel": 48, "shopping": 120, "groceries": 960, "utilities": 360, "car_rental": 60}, "net_annual_savings": 1777}, {"id": 4, "bank": "Dubai First", "name": "Dubai First Cashback Credit Card", "cashback_breakdown": {"fuel": 300, "dining": 360, "travel": 24, "shopping": 60, "groceries": 960, "utilities": 60, "car_rental": 30}, "net_annual_savings": 1395}]	2226	2026-04-28 22:09:28.030831
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_profiles (id, income_range, nationality, created_at) FROM stdin;
1	5K	United Kingdom	2026-04-28 17:35:19.490437+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, income_range, nationality, created_at) FROM stdin;
7	Test User	test@cardfiner.ae	20000-35000	AE	2026-04-28 22:08:23.212091
1	Ahmed	demo@cardfinder.ae	5K	Sri Lanka	2026-04-28 17:34:39.529553
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 2, true);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 23, true);


--
-- Name: card_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.card_rates_id_seq', 70, true);


--
-- Name: cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cards_id_seq', 9, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 7, true);


--
-- Name: income_brackets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.income_brackets_id_seq', 6, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, false);


--
-- Name: spending_benchmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.spending_benchmarks_id_seq', 35, true);


--
-- Name: user_calculations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_calculations_id_seq', 2, true);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_profiles_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: card_rates card_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_rates
    ADD CONSTRAINT card_rates_pkey PRIMARY KEY (id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: income_brackets income_brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_brackets
    ADD CONSTRAINT income_brackets_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: spending_benchmarks spending_benchmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spending_benchmarks
    ADD CONSTRAINT spending_benchmarks_pkey PRIMARY KEY (id);


--
-- Name: user_calculations user_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_calculations
    ADD CONSTRAINT user_calculations_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: card_rates card_rates_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_rates
    ADD CONSTRAINT card_rates_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: card_rates card_rates_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_rates
    ADD CONSTRAINT card_rates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: spending_benchmarks spending_benchmarks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spending_benchmarks
    ADD CONSTRAINT spending_benchmarks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: user_calculations user_calculations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_calculations
    ADD CONSTRAINT user_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict If1E2p2BUXxdTCdiVTqBHGZWVWoTyZ1a2EZ1Q0w9MEhwQ7CakXZbL4I6E0eRM82


const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/savora-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "cle-de-test-suffisamment-longue-pour-les-tests";

const {
  lireVariable,
  lireCourriel,
  lireMotDePasse,
  LONGUEUR_MINIMALE,
} = require("../src/scripts/commun");

function avec(variables, action) {
  const anciennes = { ...process.env };
  Object.assign(process.env, variables);
  try {
    return action();
  } finally {
    process.env = anciennes;
  }
}

test("une variable obligatoire absente arrête le script", () => {
  avec({ TEST_VAR: "" }, () => {
    assert.throws(() => lireVariable("TEST_VAR"), /obligatoire/);
  });
});

test("une variable facultative retombe sur sa valeur par défaut", () => {
  avec({ TEST_VAR: "" }, () => {
    assert.equal(lireVariable("TEST_VAR", { obligatoire: false, defaut: "secours" }), "secours");
  });
});

test("un courriel mal formé est refusé", () => {
  avec({ TEST_COURRIEL: "pas-un-courriel" }, () => {
    assert.throws(() => lireCourriel("TEST_COURRIEL"), /courriel valide/);
  });
});

test("un courriel valide est normalisé en minuscules", () => {
  avec({ TEST_COURRIEL: "  Admin@Savora.CA  " }, () => {
    assert.equal(lireCourriel("TEST_COURRIEL"), "admin@savora.ca");
  });
});

test("aucun mot de passe par défaut n'est accepté", () => {
  avec({ TEST_MDP: "" }, () => {
    assert.throws(() => lireMotDePasse("TEST_MDP"), /obligatoire/);
  });
});

test("un mot de passe trop court pour un compte privilégié est refusé", () => {
  avec({ TEST_MDP: "court12" }, () => {
    assert.throws(() => lireMotDePasse("TEST_MDP"), new RegExp(String(LONGUEUR_MINIMALE)));
  });
});

test("les mots de passe de démonstration du projet sont refusés", () => {
  // « Savora123! » figurait en dur dans le code et dans plusieurs notes
  // d'étape : il doit être considéré comme public.
  for (const compromis of ["Savora123!", "savora123!", "password", "changeme"]) {
    avec({ TEST_MDP: compromis }, () => {
      assert.throws(() => lireMotDePasse("TEST_MDP"), /démonstration|caractères/);
    });
  }
});

test("un mot de passe solide est accepté tel quel", () => {
  const solide = "K7v-Qm2x_Rt9Ze";
  avec({ TEST_MDP: solide }, () => {
    assert.equal(lireMotDePasse("TEST_MDP"), solide);
  });
});

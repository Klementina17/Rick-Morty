import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { translations } from './context/translations';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'primereact/resources/primereact.min.css';

const GET_CHARACTERS = gql`
  query GetCharacters($page: Int, $status: String, $species: String) {
    characters(page: $page, filter: { status: $status, species: $species }) {
      results {
        name
        status
        species
        gender
        origin {
          name
        }
        image
      }
      info {
        count
        pages
        next
      }
    }
  }
`;

function CharacterList() {

  const [results, setResults] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [availableSpecies, setAvailableSpecies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const speciesSet = React.useRef(new Set());


  const [fetchCharacters] = useLazyQuery(GET_CHARACTERS, {
    onCompleted: (data) => {
      if (data.characters) {
        const { results: newResults, info } = data.characters;
        const translatedResults = newResults.map((character) => ({
          ...character,
          status: translations[language][character.status.toLowerCase()] || character.status,
          species: translations[language][character.species.toLowerCase()] || character.species,
          gender: translations[language][character.gender.toLowerCase()] || character.gender,
          origin: { name: character.origin.name },
        }));

        data.characters.results.forEach((character) => {
          if (!speciesSet.current.has(character.species)) {
            speciesSet.current.add(character.species);
            setAvailableSpecies((prev) => [
              ...prev,
              { label: translations[language][character.species.toLowerCase()], value: character.species },
            ]);
          }
        });

        setResults((prev) =>
          page === 1
            ? translatedResults
            : [...prev, ...translatedResults].filter((c) => {
              const matchesStatus = !statusFilter || c.status === translations[language][statusFilter.toLowerCase()];
              const matchesSpecies = !speciesFilter || c.species === translations[language][speciesFilter.toLowerCase()];
              return matchesStatus && matchesSpecies;
            })
        );
        setTotalRecords(info.count);
      }
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  const loadMoreData = (pageToLoad) => {
    setLoading(true);
    fetchCharacters({
      variables: { page: pageToLoad, status: statusFilter, species: speciesFilter },
    });
  };

  const onLazyLoad = (event) => {
    const newPage = Math.ceil(event.first / 20) + 1;
    if (newPage !== page) {
      setPage(newPage);
      loadMoreData(newPage);
    }
  };

  useEffect(() => {
    setResults([]);
    setPage(1);
    speciesSet.current.clear();
    setAvailableSpecies([{ label: translations[language].all, value: "" }]);
    loadMoreData(1);
  }, [statusFilter, speciesFilter, language]);

  const columns = [
    { field: 'name', header: translations[language].name },
    { field: 'status', header: translations[language].status },
    { field: 'species', header: translations[language].species },
    { field: 'gender', header: translations[language].gender },
    {
      header: translations[language].origin,
      body: (rowData) => rowData.origin.name,
    },
  ];

  const statusOptions = [
    { label: translations[language].all, value: "" },
    { label: translations[language].alive, value: 'Alive' },
    { label: translations[language].dead, value: 'Dead' },
    { label: translations[language].unknown, value: 'unknown' },
  ];

  const handleStatusChange = (e) => {
    if (e.value.label == "All" || e.value.label == "Alle") {
      setStatusFilter("");
    }
    else {
      setStatusFilter(e.value);
    }
  };

  const handleSpeciesChange = (e) => {
    if (e.value.label == "All" || e.value.label == "Alle") {
      setSpeciesFilter("");
    }
    else {
      setSpeciesFilter(e.value);
    }
  };


  const switchLanguage = (lang) => setLanguage(lang);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>{translations[language].title}</h1>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={handleStatusChange}
          placeholder={translations[language].filterByStatus}
        />
        <Dropdown
          value={speciesFilter}
          options={availableSpecies}
          onChange={handleSpeciesChange}
          placeholder={translations[language].filterBySpecies}
        />
      </div>

      <DataTable
        value={results}
        scrollable
        sortMode="multiple"
        removableSort
        scrollHeight="400px"
        virtualScrollerOptions={{
          lazy: true,
          onLazyLoad: onLazyLoad,
          itemSize: 50,
          delay: 300
        }}
        loading={loading}
        totalRecords={totalRecords}
        emptyMessage="No characters found."
      >
        {columns.map((col, index) =>
          col.body ? (
            <Column key={index} header={col.header} body={col.body} style={{ width: '20%' }} sortable />
          ) : col.field.toLowerCase() === "name" ? (
            <Column key={index} field={col.field} header={col.header} sortable />
          ) : (
            <Column key={index} field={col.field} header={col.header} />
          )
        )}
      </DataTable>

      <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Dropdown
          value={language}
          options={[
            { label: 'English', value: 'en' },
            { label: 'Deutsch', value: 'de' },
          ]}
          onChange={(e) => switchLanguage(e.value)}
          placeholder="Select Language"
        />
      </footer>
    </div>
  );
}

export default CharacterList;

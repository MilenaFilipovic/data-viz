"""Network
Usage:
main <start-date> <end-date> <ntop>
main <start-date> <end-date> <ntop>
main 2017-06-11 2017-08-11 50"""

import os
import pandas as pd
import numpy as np
import logging as log
from docopt import docopt
from datetime import datetime

from grab_data import helpers


LANGUES_TO_REMOVE = ['DM', 'Vue', 'TeX',
                     'Makefile', 'HCL', 'CMake', 'Smarty', 'Puppet']
COLS = ['payload.pull_request.base.repo.language', 'actor.id', 'created_at']
PPs = ['imperative', 'functional', 'multi', 'declarative', 'oob', 'logic']
LANGUES_PARAD = {'JavaScript': 'oob',
                 'Java': 'oob',
                 'Python': 'oob',
                 'HTML': 'declarative',
                 'Ruby': 'oob',
                 'PHP': 'procedural',
                 'C++': 'procedural',
                 'C#': 'oob',
                 'TypeScript': 'oob',
                 'CSS': 'declarative',
                 'Go': 'multi',
                 'C': 'imperative',
                 'Shell': 'scripted',
                 'Swift': 'multi',
                 'Scala': 'multi',
                 'PowerShell': 'scripted',
                 'Jupyter Notebook': 'oob',
                 'Rust': 'multi',
                 'Objective-C': 'oob',
                 'Kotlin': 'oob',
                 'R':  'multi',
                 'Lua': 'multi',
                 'Perl': 'multi',
                 'Julia': 'multi',
                 'Groovy': 'functional',
                 'Elixir': 'functional',
                 'CoffeeScript': 'multi',
                 'Haskell': 'functional',
                 'Clojure': 'functional',
                 'OCaml': 'functional',
                 'Matlab': 'multi',
                 'Nix': 'declarative',
                 'Vim script': 'scripted',
                 'Erlang': 'functional',
                 'Dart': 'oob',
                 'XSLT': 'declarative',
                 'Emacs Lisp': 'scripted',
                 'Visual Basic': 'multi',
                 'Arduino': 'imperative',
                 'PLpgSQL': 'declarative',
                 'D': 'multi',
                 'Assembly': 'machine',
                 'Elm': 'declarative',
                 'Crystal': 'oob',
                 'Batchfile': 'scripted',
                 'F#': 'multi',
                 'Fortran': 'imperative',
                 'Pascal': 'imperative',
                 'Smalltalk': 'oob',
                 'Common Lisp': 'functional'
                 }


def create_new_cols(df):
    """
    Create new usefull columns
    :param df: dataframe
    :return: dataframe plus new columns
    """
    df['cohort'] = pd.to_datetime(df['created_at']).apply(lambda x: x.strftime('%Y-%m'))

    return df


def network_connections(df, ntop):
    """
    Calculate connection among languages
    :param df: dataframe
    :return: matrix with the number distinct common actors
    """
    filtered = df[df['payload.pull_request.base.repo.language'].apply(lambda x: x not in LANGUES_TO_REMOVE)]
    tops = filtered['payload.pull_request.base.repo.language'].value_counts().iloc[0:ntop].index
    combs = [(x, y) for x in tops for y in tops]
    filtered = filtered.set_index('payload.pull_request.base.repo.language')

    common = []

    for l1, l2 in combs:
        unique_actors_l1 = pd.Series(filtered.loc[l1]['actor.id']).unique()
        unique_actors_l2 = pd.Series(filtered.loc[l2]['actor.id']).unique()
        same_actors = len(set(unique_actors_l1) & set(unique_actors_l2))
        common.append((l1, l2, same_actors))

    return tops, pd.DataFrame(common, columns=['language1', 'language2', 'common_actors'])


if __name__ == '__main__':
    log.getLogger().setLevel(log.INFO)

    arguments = docopt(__doc__)
    start_date = arguments['<start-date>']
    end_date = arguments['<end-date>']
    top_langues = int(arguments['<ntop>'])

    helpers.are_dates_valid(start_date, end_date)

    df = helpers.get_data(helpers.DATA_FOLDER, start_date, end_date)[COLS]
    df = create_new_cols(df)


    langues, network = network_connections(df, top_langues)
    langues = pd.DataFrame(langues, columns=['language'])
    langues['paradigm'] = langues['language'].apply(lambda x: LANGUES_PARAD.get(x, 'undefined'))
    network['paradigm1'] = network['language1'].apply(lambda x: LANGUES_PARAD.get(x, 'undefined'))
    network['paradigm2'] = network['language2'].apply(lambda x: LANGUES_PARAD.get(x, 'undefined'))

    # careful!
    langues = langues.sort_values(['paradigm', 'language'])
    network = network.sort_values(['paradigm1', 'common_actors', 'language1'])

    order = (network
                  .groupby(['paradigm1', 'language1'])
                  .max()['common_actors']
                  .reset_index()
                  .sort_values(['paradigm1', 'common_actors'], ascending=False))
    order['order'] = range(order.shape[0])
    order = order.rename(columns={'language1': 'language'})[['language', 'order']]

    langues = pd.merge(langues, order, how='inner', on='language').sort_values('order')[['language', 'paradigm']]

    network = pd.merge(network, order.rename(columns={'order': 'order1'}),
                       how='inner', left_on='language1', right_on='language')
    network = pd.merge(network, order.rename(columns={'order': 'order2'}),
                       how='inner', left_on='language2', right_on='language')
    network = network.sort_values(['order1', 'order2'])[['language1', 'language2', 'paradigm1', 'paradigm2', 'common_actors']]

    file_network_data = os.path.join(helpers.DATA_FOLDER, 'network_{t}_{s}_{e}__processedat_{n}.csv'
                                         .format(t=top_langues, s=start_date, e=end_date,
                                                 n=datetime.now().strftime('%Y-%m-%d')))
    file_langues_data = os.path.join(helpers.DATA_FOLDER, 'langues_{t}_{s}_{e}__processedat_{n}.csv'
                                         .format(t=top_langues, s=start_date, e=end_date,
                                                 n=datetime.now().strftime('%Y-%m-%d')))

    langues.to_csv(file_langues_data, index=False)
    network.to_csv(file_network_data, index=False)
    log.info('Network data was saved in {f}'.format(f=file_network_data))
    log.info('Langues was saved in {f}'.format(f=file_langues_data))

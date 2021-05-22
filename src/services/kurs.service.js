import { Between, getRepository as repository } from 'typeorm';
import Kurs from '../models/kurs.models';
import CurrenciesService from './currencies.service';

const currenciesService = new CurrenciesService();

export default class KursService {

    kursRepository() {
        return repository(Kurs);
    }

    async search(startDate, endDate) {
        if (startDate && endDate) {
            let findArgs = {
                where: {
                    date: Between(startDate, endDate),
                }
            };
            return await this.kursRepository().find(findArgs);
        } else {
            return await this.kursRepository().find();
        }
    }

    async findBySymbolWithStartDateAndEndDate(symbol, startDate, endDate) {
        const kurs = await this.kursRepository().createQueryBuilder('kurs')
            .leftJoinAndSelect('kurs.type', 'type')
            .leftJoinAndSelect('kurs.symbol', 'symbol')
            .where('kurs.date >= :startDate', { startDate })
            .where('kurs.date <= :endDate', { endDate })
            .andWhere('symbol.code = :code', { code: symbol })
            .getMany();

        return kurs;
    }

    async findBySymbolAndDate(symbol, date) {

        const kurs = await this.kursRepository().createQueryBuilder('kurs')
            .leftJoinAndSelect('kurs.symbol', 'symbol')
            .where('kurs.date = :date', { date })
            .andWhere('symbol.code = :code', { code: symbol })
            .getOne();

        return kurs;
    }

    async create(kursPayload) {

        let kurs = await this.findBySymbolAndDate(kursPayload.symbol, kursPayload.date);

        if (kurs) {
            throw new Error('Kurs already exist!');
        } else {
            const eRate = { name: 'E-Rate', ...kursPayload.e_rate };
            const tt = { name: 'TT Counter', ...kursPayload.tt_counter };
            const bn = { name: 'Bank Notes', ...kursPayload.bank_notes };

            const symbol = await currenciesService.findByCode(kursPayload.symbol);
            if (!symbol) {
                throw new Error('Symbol not found!')
            }

            const payload = {
                symbol,
                type: [
                    eRate,
                    tt,
                    bn
                ],
                date: kursPayload.date
            }
            return this.kursRepository().save(payload);
        }

    }

    async update(kursPayload) {
        let kurs = await this.findBySymbolAndDate(kursPayload.symbol, kursPayload.date);

        if (!kurs) {
            throw new Error(`Entity not found!`);
        }

        const eRate = { name: 'E-Rate', ...kursPayload.e_rate };
        const tt = { name: 'TT Counter', ...kursPayload.tt_counter };
        const bn = { name: 'Bank Notes', ...kursPayload.bank_notes };

        const symbol = await currenciesService.findByCode(kursPayload.symbol);
        if (!symbol) {
            throw new Error(`Symbol not found!`);
        }

        const payload = {
            id: kurs.id,
            symbol,
            type: [
                eRate,
                tt,
                bn
            ],
            date: kursPayload.date
        }

        return await this.kursRepository().save(payload);
    }

    async deleteByDate(date) {
        const kurs = await this.kursRepository().findOne({ date });
        if (!kurs) {
            throw new Error(`Entity not found!`);
        }
        return await this.kursRepository().delete({ date });
    }

}